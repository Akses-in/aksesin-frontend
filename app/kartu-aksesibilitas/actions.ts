"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canCancelCardStatus,
  canEditCardStatus,
  cardBackendRequest,
  cardStatusMap,
  disabilityCategoryOptions,
  documentTypeOptions,
  type CardStatus,
  type DigitalCardRow,
  type DisabilityCategory,
  type DocumentType,
  validateDocumentFile,
} from "@/lib/digital-card";
import { accessibilityOptions } from "@/lib/preferences";
import { verifiedAccount } from "@/lib/supabase";

const validCategories = new Set<string>(disabilityCategoryOptions.map(([value]) => value));
const validDocumentTypes = new Set<string>(documentTypeOptions.map(([value]) => value));
const validNeeds = new Set<string>(accessibilityOptions.map(([value]) => value));

function buildDedupKey(cardId: string, prevStatus: string | null, nextStatus: CardStatus, reason: string, stamp: string) {
  const raw = `${cardId}:${prevStatus ?? "none"}->${nextStatus}:${reason.trim()}:${stamp.slice(0, 19)}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 40);
}

export async function submitCardApplication(form: FormData): Promise<string> {
  const { supabase, user } = await verifiedAccount();

  const fullName = String(form.get("full_name") ?? "").trim();
  const disabilityCategory = String(form.get("disability_category") ?? "").trim();
  const documentType = String(form.get("document_type") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const consent = form.get("consent") === "on" || form.get("consent") === "true";
  const needs = Array.from(new Set(form.getAll("needs").map(String)));
  const rawFile = form.get("supporting_document");
  const file = rawFile instanceof File ? rawFile : null;

  if (fullName.length < 2 || fullName.length > 100) {
    return "Masukkan nama lengkap antara 2 hingga 100 karakter.";
  }
  if (!validCategories.has(disabilityCategory)) {
    return "Pilih kategori disabilitas yang sesuai.";
  }
  if (!validDocumentTypes.has(documentType)) {
    return "Pilih jenis dokumen pendukung.";
  }
  if (needs.length > 6 || !needs.every((item) => validNeeds.has(item))) {
    return "Pilihan kebutuhan aksesibilitas tidak valid.";
  }
  if (notes.length > 500) {
    return "Catatan tambahan maksimal 500 karakter.";
  }
  if (!consent) {
    return "Kamu perlu menyetujui pemrosesan data dan dokumen pendukung untuk mengajukan kartu.";
  }

  const fileCheck = validateDocumentFile(file, true);
  if (!fileCheck.ok || !fileCheck.file) {
    return !fileCheck.ok ? fileCheck.error : "Dokumen pendukung wajib diunggah.";
  }

  const arrayBuffer = await fileCheck.file.arrayBuffer();
  const contentBase64 = Buffer.from(arrayBuffer).toString("base64");
  const safeFileName = fileCheck.file.name.trim();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    const backendResp = await cardBackendRequest(
      "/api/card-applications",
      session.access_token,
      {
        method: "POST",
        body: {
          fullName,
          disabilityCategory,
          needs,
          notes,
          consentGiven: true,
          document: {
            documentType,
            fileName: safeFileName,
            mimeType: fileCheck.file.type,
            fileSize: fileCheck.file.size,
            contentBase64,
          },
        },
      },
    );

    if (backendResp) {
      if (backendResp.ok) {
        revalidatePath("/kartu-aksesibilitas");
        revalidatePath("/akun");
        redirect("/kartu-aksesibilitas?tersimpan=baru");
      }
      const errBody = (await backendResp.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (errBody?.error?.message) {
        return errBody.error.message;
      }
    }
  }

  // Fallback to direct Supabase PostgREST if backend is offline
  const { data: existingActive } = await supabase
    .from("digital_cards")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "diproses", "perbaikan", "verified"])
    .maybeSingle<{ id: string; status: CardStatus }>();

  if (existingActive) {
    return "Kamu sudah memiliki pengajuan Digital Accessibility Card yang sedang aktif.";
  }

  const nowIso = new Date().toISOString();
  const { data: createdCard, error: cardError } = await supabase
    .from("digital_cards")
    .insert({
      user_id: user.id,
      full_name: fullName,
      disability_category: disabilityCategory as DisabilityCategory,
      needs,
      notes,
      consent_given: true,
      consent_at: nowIso,
      status: "pending",
      submitted_at: nowIso,
      updated_at: nowIso,
    })
    .select("*")
    .single<DigitalCardRow>();

  if (cardError || !createdCard) {
    return "Pengajuan kartu belum dapat disimpan. Pastikan server backend aktif lalu coba lagi.";
  }

  const fileHash = createHash("sha256").update(Buffer.from(arrayBuffer)).digest("hex").slice(0, 16);
  const filePath = `private://card-evidence/${user.id}/${createdCard.id}/${fileHash}-${safeFileName}`;

  const { error: evidenceError } = await supabase.from("card_evidence").insert({
    card_id: createdCard.id,
    user_id: user.id,
    document_type: documentType as DocumentType,
    file_name: safeFileName,
    mime_type: fileCheck.file.type,
    file_size: fileCheck.file.size,
    file_path: filePath,
  });

  if (evidenceError) {
    return "Dokumen pendukung belum dapat disimpan. Silakan perbarui pengajuanmu.";
  }

  const statusMeta = cardStatusMap.pending;
  const dedupKey = buildDedupKey(createdCard.id, null, "pending", "", createdCard.updated_at);
  await supabase.from("card_notifications").upsert(
    {
      user_id: user.id,
      card_id: createdCard.id,
      status: "pending",
      title: statusMeta.notificationTitle,
      message: statusMeta.defaultNotificationMessage,
      deep_link: `/kartu-aksesibilitas#pengajuan-${createdCard.id}`,
      dedup_key: dedupKey,
    },
    { onConflict: "dedup_key", ignoreDuplicates: true },
  );

  revalidatePath("/kartu-aksesibilitas");
  revalidatePath("/akun");
  redirect("/kartu-aksesibilitas?tersimpan=baru");
}

export async function updateCardApplication(form: FormData): Promise<string> {
  const { supabase, user } = await verifiedAccount();

  const cardId = String(form.get("card_id") ?? "").trim();
  const fullName = String(form.get("full_name") ?? "").trim();
  const disabilityCategory = String(form.get("disability_category") ?? "").trim();
  const documentType = String(form.get("document_type") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const consent = form.get("consent") === "on" || form.get("consent") === "true";
  const needs = Array.from(new Set(form.getAll("needs").map(String)));
  const rawFile = form.get("supporting_document");
  const file = rawFile instanceof File && rawFile.size > 0 ? rawFile : null;

  if (!/^[a-f0-9-]{36}$/i.test(cardId)) {
    return "ID pengajuan tidak valid.";
  }
  if (fullName.length < 2 || fullName.length > 100) {
    return "Masukkan nama lengkap antara 2 hingga 100 karakter.";
  }
  if (!validCategories.has(disabilityCategory)) {
    return "Pilih kategori disabilitas yang sesuai.";
  }
  if (!validDocumentTypes.has(documentType)) {
    return "Pilih jenis dokumen pendukung.";
  }
  if (needs.length > 6 || !needs.every((item) => validNeeds.has(item))) {
    return "Pilihan kebutuhan aksesibilitas tidak valid.";
  }
  if (notes.length > 500) {
    return "Catatan tambahan maksimal 500 karakter.";
  }
  if (!consent) {
    return "Persetujuan pemrosesan data wajib tetap dicentang untuk memperbarui pengajuan.";
  }

  const fileCheck = validateDocumentFile(file, false);
  if (!fileCheck.ok) {
    return fileCheck.error;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    let documentPayload:
      | {
          documentType: string;
          fileName: string;
          mimeType: string;
          fileSize: number;
          contentBase64: string;
        }
      | undefined;
    if (fileCheck.file) {
      const arrayBuffer = await fileCheck.file.arrayBuffer();
      documentPayload = {
        documentType,
        fileName: fileCheck.file.name.trim(),
        mimeType: fileCheck.file.type,
        fileSize: fileCheck.file.size,
        contentBase64: Buffer.from(arrayBuffer).toString("base64"),
      };
    }

    const backendResp = await cardBackendRequest(
      `/api/card-applications/${cardId}`,
      session.access_token,
      {
        method: "PATCH",
        body: {
          fullName,
          disabilityCategory,
          needs,
          notes,
          consentGiven: true,
          ...(documentPayload ? { document: documentPayload } : {}),
        },
      },
    );

    if (backendResp) {
      if (backendResp.ok) {
        revalidatePath("/kartu-aksesibilitas");
        redirect("/kartu-aksesibilitas?tersimpan=perbarui");
      }
      const errBody = (await backendResp.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (errBody?.error?.message) {
        return errBody.error.message;
      }
    }
  }

  const { data: current } = await supabase
    .from("digital_cards")
    .select("*")
    .eq("id", cardId)
    .eq("user_id", user.id)
    .maybeSingle<DigitalCardRow>();

  if (!current) {
    return "Data pengajuan tidak ditemukan atau kamu tidak memiliki akses.";
  }
  if (!canEditCardStatus(current.status)) {
    return "Pengajuan hanya dapat diperbarui sebelum proses verifikasi selesai (saat menunggu peninjauan atau butuh perbaikan).";
  }

  const nextStatus: CardStatus = current.status === "perbaikan" ? "pending" : current.status;
  const nowIso = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("digital_cards")
    .update({
      full_name: fullName,
      disability_category: disabilityCategory as DisabilityCategory,
      needs,
      notes,
      status: nextStatus,
      updated_at: nowIso,
    })
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (updateError) {
    return "Perubahan pengajuan belum dapat disimpan. Coba lagi nanti.";
  }

  if (fileCheck.file) {
    const arrayBuffer = await fileCheck.file.arrayBuffer();
    const fileHash = createHash("sha256").update(Buffer.from(arrayBuffer)).digest("hex").slice(0, 16);
    const safeFileName = fileCheck.file.name.trim();
    const filePath = `private://card-evidence/${user.id}/${cardId}/${fileHash}-${safeFileName}`;

    await supabase.from("card_evidence").delete().eq("card_id", cardId).eq("user_id", user.id);
    const { error: evidenceError } = await supabase.from("card_evidence").insert({
      card_id: cardId,
      user_id: user.id,
      document_type: documentType as DocumentType,
      file_name: safeFileName,
      mime_type: fileCheck.file.type,
      file_size: fileCheck.file.size,
      file_path: filePath,
    });

    if (evidenceError) {
      return "Dokumen pendukung baru belum dapat disimpan. Coba lagi.";
    }
  } else {
    // Update document_type on existing evidence if changed
    await supabase
      .from("card_evidence")
      .update({ document_type: documentType as DocumentType })
      .eq("card_id", cardId)
      .eq("user_id", user.id);
  }

  if (current.status !== nextStatus) {
    const statusMeta = cardStatusMap[nextStatus];
    const reason = "Perbaikan dokumen dan data telah dikirim ulang.";
    const dedupKey = buildDedupKey(cardId, current.status, nextStatus, reason, nowIso);
    await supabase.from("card_notifications").upsert(
      {
        user_id: user.id,
        card_id: cardId,
        status: nextStatus,
        title: statusMeta.notificationTitle,
        message: `${statusMeta.defaultNotificationMessage} Catatan: ${reason}`,
        deep_link: `/kartu-aksesibilitas#pengajuan-${cardId}`,
        dedup_key: dedupKey,
      },
      { onConflict: "dedup_key", ignoreDuplicates: true },
    );
  }

  revalidatePath("/kartu-aksesibilitas");
  redirect("/kartu-aksesibilitas?tersimpan=perbarui");
}

export async function cancelCardApplication(form: FormData): Promise<string> {
  const { supabase, user } = await verifiedAccount();
  const cardId = String(form.get("card_id") ?? "").trim();

  if (!/^[a-f0-9-]{36}$/i.test(cardId)) {
    return "ID pengajuan tidak valid.";
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    const backendResp = await cardBackendRequest(
      `/api/card-applications/${cardId}/cancel`,
      session.access_token,
      { method: "POST" },
    );

    if (backendResp) {
      if (backendResp.ok) {
        revalidatePath("/kartu-aksesibilitas");
        revalidatePath("/akun");
        redirect("/kartu-aksesibilitas?tersimpan=batal");
      }
      const errBody = (await backendResp.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      if (errBody?.error?.message) {
        return errBody.error.message;
      }
    }
  }

  const { data: current } = await supabase
    .from("digital_cards")
    .select("*")
    .eq("id", cardId)
    .eq("user_id", user.id)
    .maybeSingle<DigitalCardRow>();

  if (!current) {
    return "Data pengajuan tidak ditemukan atau kamu tidak memiliki akses.";
  }
  if (!canCancelCardStatus(current.status)) {
    return "Pengajuan yang sudah selesai diverifikasi atau dibatalkan tidak dapat dibatalkan kembali.";
  }

  const nowIso = new Date().toISOString();

  // Withdraw supporting evidence upon cancellation
  await supabase.from("card_evidence").delete().eq("card_id", cardId).eq("user_id", user.id);

  const { error: cancelError } = await supabase
    .from("digital_cards")
    .update({
      status: "dibatalkan",
      cancelled_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (cancelError) {
    return "Pengajuan belum dapat dibatalkan. Coba lagi nanti.";
  }

  const statusMeta = cardStatusMap.dibatalkan;
  const dedupKey = buildDedupKey(cardId, current.status, "dibatalkan", "user_cancelled", nowIso);
  await supabase.from("card_notifications").upsert(
    {
      user_id: user.id,
      card_id: cardId,
      status: "dibatalkan",
      title: statusMeta.notificationTitle,
      message: statusMeta.defaultNotificationMessage,
      deep_link: `/kartu-aksesibilitas#pengajuan-${cardId}`,
      dedup_key: dedupKey,
    },
    { onConflict: "dedup_key", ignoreDuplicates: true },
  );

  revalidatePath("/kartu-aksesibilitas");
  revalidatePath("/akun");
  redirect("/kartu-aksesibilitas?tersimpan=batal");
}

export async function markCardNotificationRead(form: FormData): Promise<void> {
  const { supabase, user } = await verifiedAccount();
  const notificationId = String(form.get("notification_id") ?? "").trim();
  if (!/^[a-f0-9-]{36}$/i.test(notificationId)) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    const resp = await cardBackendRequest(
      `/api/notifications/${notificationId}/read`,
      session.access_token,
      { method: "PATCH" },
    );
    if (resp?.ok) {
      revalidatePath("/kartu-aksesibilitas");
      return;
    }
  }

  await supabase
    .from("card_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/kartu-aksesibilitas");
}

export async function markAllCardNotificationsRead(): Promise<void> {
  const { supabase, user } = await verifiedAccount();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    const resp = await cardBackendRequest(
      "/api/notifications/read-all",
      session.access_token,
      { method: "POST" },
    );
    if (resp?.ok) {
      revalidatePath("/kartu-aksesibilitas");
      return;
    }
  }

  await supabase
    .from("card_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  revalidatePath("/kartu-aksesibilitas");
}

