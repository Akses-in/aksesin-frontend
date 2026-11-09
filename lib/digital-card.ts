export const cardStatuses = [
  "pending",
  "diproses",
  "perbaikan",
  "verified",
  "rejected",
  "dicabut",
  "dibatalkan",
] as const;

export type CardStatus = (typeof cardStatuses)[number];

export const disabilityCategoryOptions = [
  ["fisik", "Disabilitas fisik / mobilitas"],
  ["sensorik_netra", "Disabilitas sensorik netra / visual"],
  ["sensorik_runguwicara", "Disabilitas sensorik rungu / wicara"],
  ["intelektual", "Disabilitas intelektual"],
  ["mental", "Disabilitas mental / psikososial"],
  ["ganda_lainnya", "Disabilitas ganda / lainnya"],
] as const;

export type DisabilityCategory = (typeof disabilityCategoryOptions)[number][0];

export const documentTypeOptions = [
  ["surat_keterangan", "Surat keterangan disabilitas / pendampingan"],
  ["kartu_komunitas", "Kartu anggota organisasi / komunitas disabilitas"],
  ["dokumen_pendukung_lain", "Dokumen pendukung aksesibilitas lainnya"],
] as const;

export type DocumentType = (typeof documentTypeOptions)[number][0];

export const allowedDocumentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedDocumentMime = (typeof allowedDocumentMimeTypes)[number];

export const MAX_CARD_DOCUMENT_BYTES = 5 * 1024 * 1024; // 5 MB

export type CardStatusMeta = {
  label: string;
  badgeClass: "badge" | "badge active" | "badge warning" | "badge danger";
  description: string;
  canEdit: boolean;
  canCancel: boolean;
  notificationTitle: string;
  defaultNotificationMessage: string;
};

export const cardStatusMap: Record<CardStatus, CardStatusMeta> = {
  pending: {
    label: "Menunggu peninjauan",
    badgeClass: "badge",
    description: "Pengajuan sudah diterima dan menunggu antrean pemeriksaan tim verifikasi.",
    canEdit: true,
    canCancel: true,
    notificationTitle: "Pengajuan kartu diterima",
    defaultNotificationMessage:
      "Pengajuan Digital Accessibility Card kamu telah diterima dan menunggu peninjauan.",
  },
  diproses: {
    label: "Sedang diproses",
    badgeClass: "badge active",
    description: "Tim verifikasi sedang meninjau data dan dokumen pendukung pengajuanmu.",
    canEdit: false,
    canCancel: true,
    notificationTitle: "Pengajuan kartu sedang diproses",
    defaultNotificationMessage:
      "Tim verifikasi sedang memeriksa data dan dokumen pengajuan kartumu.",
  },
  perbaikan: {
    label: "Butuh perbaikan dokumen",
    badgeClass: "badge warning",
    description:
      "Pengajuan memerlukan perbaikan data atau dokumen pendukung sebelum dapat disetujui.",
    canEdit: true,
    canCancel: true,
    notificationTitle: "Pengajuan kartu membutuhkan perbaikan",
    defaultNotificationMessage:
      "Mohon perbarui data atau unggah ulang dokumen pendukung sesuai catatan peninjau.",
  },
  verified: {
    label: "Terverifikasi",
    badgeClass: "badge active",
    description:
      "Pengajuan disetujui. Digital Accessibility Card kamu aktif untuk membantu profil aksesibilitasmu.",
    canEdit: false,
    canCancel: false,
    notificationTitle: "Digital Accessibility Card disetujui",
    defaultNotificationMessage:
      "Selamat! Pengajuan Digital Accessibility Card kamu telah disetujui dan aktif.",
  },
  rejected: {
    label: "Ditolak",
    badgeClass: "badge danger",
    description: "Pengajuan belum dapat disetujui. Kamu dapat membaca alasan penolakan dan mengajukan kembali.",
    canEdit: false,
    canCancel: false,
    notificationTitle: "Pengajuan kartu belum disetujui",
    defaultNotificationMessage:
      "Pengajuan Digital Accessibility Card kamu belum dapat disetujui. Periksa catatan pada detail kartu.",
  },
  dicabut: {
    label: "Dicabut",
    badgeClass: "badge danger",
    description: "Status verifikasi kartu telah dicabut. Kamu dapat melihat alasan pencabutan di bawah.",
    canEdit: false,
    canCancel: false,
    notificationTitle: "Status Digital Accessibility Card dicabut",
    defaultNotificationMessage:
      "Status verifikasi Digital Accessibility Card kamu telah dicabut. Lihat detail pada halaman kartu.",
  },
  dibatalkan: {
    label: "Dibatalkan",
    badgeClass: "badge",
    description: "Pengajuan telah dibatalkan atas permintaanmu dan dokumen pendukung telah ditarik.",
    canEdit: false,
    canCancel: false,
    notificationTitle: "Pengajuan kartu dibatalkan",
    defaultNotificationMessage:
      "Pengajuan Digital Accessibility Card telah dibatalkan dan dokumen pendukung ditarik.",
  },
};

export function canEditCardStatus(status: CardStatus): boolean {
  return cardStatusMap[status]?.canEdit ?? false;
}

export function canCancelCardStatus(status: CardStatus): boolean {
  return cardStatusMap[status]?.canCancel ?? false;
}

export type DigitalCardRow = {
  id: string;
  user_id: string;
  full_name: string;
  disability_category: DisabilityCategory;
  needs: string[];
  notes: string;
  consent_given: boolean;
  consent_at: string;
  status: CardStatus;
  reviewer_note: string;
  submitted_at: string;
  updated_at: string;
  verified_at: string | null;
  cancelled_at: string | null;
};

export type CardEvidenceRow = {
  id: string;
  card_id: string;
  user_id: string;
  document_type: DocumentType;
  file_name: string;
  mime_type: AllowedDocumentMime;
  file_size: number;
  file_path: string;
  uploaded_at: string;
};

export type CardVerificationRow = {
  id: string;
  card_id: string;
  actor_id: string | null;
  previous_status: CardStatus | null;
  new_status: CardStatus;
  reason: string;
  created_at: string;
};

export type CardNotificationRow = {
  id: string;
  user_id: string;
  card_id: string;
  status: CardStatus;
  title: string;
  message: string;
  deep_link: string;
  dedup_key: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDateId(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function validateDocumentFile(
  file: File | null,
  required: boolean,
): { ok: true; file: File | null } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    if (required) {
      return { ok: false, error: "Unggah dokumen pendukung (PDF, JPG, PNG, atau WebP maksimal 5 MB)." };
    }
    return { ok: true, file: null };
  }

  if (!allowedDocumentMimeTypes.includes(file.type as AllowedDocumentMime)) {
    return { ok: false, error: "Format dokumen tidak didukung. Gunakan berkas PDF, JPG, PNG, atau WebP." };
  }

  if (file.size > MAX_CARD_DOCUMENT_BYTES) {
    return { ok: false, error: "Ukuran dokumen melebihi batas maksimal 5 MB." };
  }

  const cleanName = file.name.trim();
  if (!cleanName || cleanName.length > 255 || /[<>:"/\\|?*\x00-\x1F]/.test(cleanName)) {
    return { ok: false, error: "Nama berkas dokumen tidak valid." };
  }

  return { ok: true, file };
}

export function validateDocumentFiles(files: File[], required: boolean): string {
  if (files.length > 3) return "Unggah maksimal tiga dokumen pendukung.";
  if (required && !files.length) return "Unggah minimal satu dokumen pendukung.";

  for (const file of files) {
    const result = validateDocumentFile(file, true);
    if (!result.ok) return `${file.name}: ${result.error}`;
  }
  return "";
}

export type BackendCardEvidence = {
  id: string;
  cardId: string;
  userId: string;
  documentType: DocumentType;
  fileName: string;
  mimeType: AllowedDocumentMime;
  fileSize: number;
  filePath: string;
  uploadedAt: string;
};

export type BackendCardApplication = {
  id: string;
  userId: string;
  fullName: string;
  disabilityCategory: DisabilityCategory;
  needs: string[];
  notes: string;
  consentGiven: boolean;
  consentAt: string;
  status: CardStatus;
  reviewerNote: string;
  submittedAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  cancelledAt: string | null;
  evidence: BackendCardEvidence | null;
  documents?: BackendCardEvidence[];
};

export type BackendCardNotification = {
  id: string;
  userId: string;
  cardId: string;
  status: CardStatus;
  title: string;
  message: string;
  deepLink: string;
  dedupKey: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

export function mapBackendCardToRow(item: BackendCardApplication): {
  card: DigitalCardRow;
  evidence: CardEvidenceRow[];
} {
  return {
    card: {
      id: item.id,
      user_id: item.userId,
      full_name: item.fullName,
      disability_category: item.disabilityCategory,
      needs: item.needs,
      notes: item.notes,
      consent_given: item.consentGiven,
      consent_at: item.consentAt,
      status: item.status,
      reviewer_note: item.reviewerNote,
      submitted_at: item.submittedAt,
      updated_at: item.updatedAt,
      verified_at: item.verifiedAt,
      cancelled_at: item.cancelledAt,
    },
    evidence: (item.documents ?? (item.evidence ? [item.evidence] : [])).map((document) => ({
      id: document.id,
      card_id: document.cardId,
      user_id: document.userId,
      document_type: document.documentType,
      file_name: document.fileName,
      mime_type: document.mimeType,
      file_size: document.fileSize,
      file_path: document.filePath,
      uploaded_at: document.uploadedAt,
    })),
  };
}

export function mapBackendNotificationToRow(item: BackendCardNotification): CardNotificationRow {
  return {
    id: item.id,
    user_id: item.userId,
    card_id: item.cardId,
    status: item.status,
    title: item.title,
    message: item.message,
    deep_link: item.deepLink,
    dedup_key: item.dedupKey,
    is_read: item.isRead,
    created_at: item.createdAt,
    read_at: item.readAt,
  };
}

export async function cardBackendRequest(
  path: string,
  accessToken: string,
  options?: { method?: string; body?: unknown },
): Promise<Response | null> {
  const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";
  try {
    return await fetch(new URL(path, backend), {
      method: options?.method ?? "GET",
      headers: {
        ...(options?.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${accessToken}`,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return null;
  }
}

