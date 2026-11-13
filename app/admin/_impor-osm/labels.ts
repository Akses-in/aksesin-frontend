import type { AccessibilityAttributes, AccessibilityStatus } from "@/lib/accessibility";

// Definisi status dan atribut dipakai bersama dengan peta pengguna.
export {
  accessibilityAttributeKeys,
  accessibilityStatusMeta,
  attributeLabels,
  attributeValueLabel,
  osmUrl,
  type AccessibilityAttributeKey,
  type AccessibilityAttributes,
  type AccessibilityStatus,
} from "@/lib/accessibility";

export type ImportJobStatus = "queued" | "running" | "succeeded" | "failed";
export type PlaceSource = "manual" | "osm";
export type DeleteReason = "duplicate" | "invalid";


export type ImportJob = {
  id: string;
  status: ImportJobStatus;
  area: string;
  startedAt: string | null;
  finishedAt: string | null;
  fetchedCount: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  skippedCount: number;
  skipBreakdown: Partial<Record<string, number>>;
  errorMessage: string | null;
  sourceEndpoint: string | null;
  createdAt: string;
};

export type AdminPlace = {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  accessibilityStatus: AccessibilityStatus;
  accessibilityAttributes: AccessibilityAttributes;
  dataSource: PlaceSource;
  osmType: "node" | "way" | "relation" | null;
  osmId: number | null;
  editedByAdmin: boolean;
  updatedAt: string;
  savedCount: number;
  contributionCount: number;
};

export type DuplicateCandidate = { distanceMeters: number; places: [AdminPlace, AdminPlace] };

export type AdminNotification = {
  id: string;
  type: "osm_import_succeeded" | "osm_import_failed";
  jobId: string | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

export type DeletePlaceResult = {
  id: string;
  name: string;
  excluded: boolean;
  savedByCount: number;
  contributionCount: number;
};

export type PlaceUpdate = Partial<{
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  accessibilityStatus: AccessibilityStatus;
  accessibilityAttributes: AccessibilityAttributes;
}>;

type Badge = "badge" | "badge active" | "badge warning" | "badge danger";

export const jobStatusMeta: Record<ImportJobStatus, { label: string; badge: Badge }> = {
  queued: { label: "Menunggu", badge: "badge" },
  running: { label: "Berjalan", badge: "badge warning" },
  succeeded: { label: "Berhasil", badge: "badge active" },
  failed: { label: "Gagal", badge: "badge danger" },
};

export const skipReasonLabels: Record<string, string> = {
  invalid_element: "Format tidak valid",
  no_name: "Tanpa nama",
  no_coordinates: "Tanpa koordinat",
  outside_area: "Di luar daratan Jakarta",
  field_too_long: "Data terlalu panjang",
  no_category: "Kategori tidak dikenali",
  duplicate_in_response: "Ganda dalam respons",
  excluded: "Pernah dihapus admin",
  edited_by_admin: "Sudah diedit admin",
};

export const placeCategories = [
  "kesehatan",
  "pendidikan",
  "layanan publik",
  "transportasi",
  "perbelanjaan",
  "taman",
  "wisata dan budaya",
  "keuangan",
];

export function isActiveJob(job: Pick<ImportJob, "status"> | null | undefined) {
  return job?.status === "queued" || job?.status === "running";
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const wibParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// Disusun manual dari angka supaya hasil server dan browser selalu sama.
export function formatWib(iso: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  const part = (type: Intl.DateTimeFormatPartTypes) => wibParts.formatToParts(date).find((item) => item.type === type)?.value ?? "";
  return `${Number(part("day"))} ${monthNames[Number(part("month")) - 1]} ${part("year")}, ${part("hour")}.${part("minute")} WIB`;
}

