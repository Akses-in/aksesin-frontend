"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cardBackendRequest,
  disabilityCategoryOptions,
  documentTypeOptions,
  validateDocumentFiles,
} from "@/lib/digital-card";
import { accessibilityOptions } from "@/lib/preferences";
import { verifiedAccount } from "@/lib/supabase";

const validCategories = new Set<string>(disabilityCategoryOptions.map(([value]) => value));
const validDocumentTypes = new Set<string>(documentTypeOptions.map(([value]) => value));
const validNeeds = new Set<string>(accessibilityOptions.map(([value]) => value));
const cardIdPattern = /^[a-f0-9-]{36}$/i;

async function cardResponseError(response: Response | null, fallback: string) {
  const body = (await response?.json().catch(() => null)) as {
    error?: { message?: string };
  } | null | undefined;
  return body?.error?.message ?? fallback;
}

async function saveCardApplication(form: FormData, cardId?: string): Promise<string> {
  const { supabase } = await verifiedAccount();
  const fullName = String(form.get("full_name") ?? "").trim();
  const disabilityCategory = String(form.get("disability_category") ?? "").trim();
  const documentType = String(form.get("document_type") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const consent = form.get("consent") === "on" || form.get("consent") === "true";
  const needs = Array.from(new Set(form.getAll("needs").map(String)));

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
    return "Kamu perlu menyetujui pemrosesan data dan dokumen pendukung.";
  }

  const entries = form.getAll("supporting_document");
  if (!entries.every((entry) => entry instanceof File)) {
    return "Dokumen pendukung tidak valid.";
  }
  const files = entries.filter((file) => file.name !== "" || file.size !== 0);
  const fileError = validateDocumentFiles(files, !cardId);
  if (fileError) return fileError;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return "Sesi berakhir. Silakan masuk kembali.";

  const documents = await Promise.all(files.map(async (file) => ({
    documentType,
    fileName: file.name.trim(),
    mimeType: file.type,
    fileSize: file.size,
    contentBase64: Buffer.from(await file.arrayBuffer()).toString("base64"),
  })));
  const response = await cardBackendRequest(
    cardId ? `/api/card-applications/${cardId}` : "/api/card-applications",
    session.access_token,
    {
      method: cardId ? "PATCH" : "POST",
      body: {
        fullName,
        disabilityCategory,
        needs,
        notes,
        consentGiven: true,
        ...(documents.length ? { documents } : { documentType }),
      },
    },
  );

  if (!response?.ok) {
    return cardResponseError(response, "Pengajuan belum dapat disimpan. Coba lagi nanti.");
  }
  revalidatePath("/kartu-aksesibilitas");
  revalidatePath("/akun");
  redirect(`/kartu-aksesibilitas?tersimpan=${cardId ? "perbarui" : "baru"}`);
}

export async function submitCardApplication(form: FormData): Promise<string> {
  return saveCardApplication(form);
}

export async function updateCardApplication(form: FormData): Promise<string> {
  const cardId = String(form.get("card_id") ?? "").trim();
  if (!cardIdPattern.test(cardId)) return "ID pengajuan tidak valid.";
  return saveCardApplication(form, cardId);
}

export async function cancelCardApplication(form: FormData): Promise<string> {
  const { supabase } = await verifiedAccount();
  const cardId = String(form.get("card_id") ?? "").trim();
  if (!cardIdPattern.test(cardId)) return "ID pengajuan tidak valid.";

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return "Sesi berakhir. Silakan masuk kembali.";

  const response = await cardBackendRequest(
    `/api/card-applications/${cardId}/cancel`,
    session.access_token,
    { method: "POST" },
  );
  if (!response?.ok) {
    return cardResponseError(response, "Pengajuan belum dapat dibatalkan. Coba lagi nanti.");
  }
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

