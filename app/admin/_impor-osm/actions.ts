"use server";

import { refresh } from "next/cache";
import { isUuid } from "@/lib/place";
import { adminAccessToken, adminApi, type ApiResult } from "./backend";
import {
  accessibilityAttributeKeys,
  type AdminPlace,
  type DeletePlaceResult,
  type DeleteReason,
  type ImportJob,
  type PlaceUpdate,
} from "./labels";

const invalidId = { ok: false, status: 400, message: "Data tidak dikenali. Muat ulang halaman." } as const;
const statuses = new Set(["accessible", "partial", "unknown"]);

// Setiap Server Action memeriksa ulang sesi admin karena bisa dipanggil langsung lewat POST.

export async function startOsmImport(): Promise<ApiResult<ImportJob>> {
  return adminApi<ImportJob>("/api/admin/osm-imports", await adminAccessToken(true), { method: "POST" });
}

export async function getOsmImportJob(id: string): Promise<ApiResult<ImportJob>> {
  if (!isUuid(id)) return invalidId;
  return adminApi<ImportJob>(`/api/admin/osm-imports/${id}`, await adminAccessToken(true));
}

export async function deleteAdminPlace(id: string, reason: DeleteReason): Promise<ApiResult<DeletePlaceResult>> {
  if (!isUuid(id) || (reason !== "duplicate" && reason !== "invalid")) return invalidId;
  return adminApi<DeletePlaceResult>(`/api/admin/places/${id}`, await adminAccessToken(true), {
    method: "DELETE",
    body: { reason },
  });
}

export async function updateAdminPlace(id: string, update: PlaceUpdate): Promise<ApiResult<AdminPlace>> {
  if (!isUuid(id) || typeof update !== "object" || update === null) return invalidId;

  // Hanya field yang dikenal yang diteruskan. Validasi lengkap tetap dilakukan backend.
  const body: PlaceUpdate = {};
  for (const key of ["name", "category", "address"] as const) {
    if (typeof update[key] === "string") body[key] = update[key];
  }
  if (typeof update.latitude === "number" && typeof update.longitude === "number") {
    body.latitude = update.latitude;
    body.longitude = update.longitude;
  }
  if (update.accessibilityStatus && statuses.has(update.accessibilityStatus)) {
    body.accessibilityStatus = update.accessibilityStatus;
  }
  if (update.accessibilityAttributes && typeof update.accessibilityAttributes === "object") {
    body.accessibilityAttributes = Object.fromEntries(accessibilityAttributeKeys
      .filter((key) => typeof update.accessibilityAttributes?.[key] === "string")
      .map((key) => [key, update.accessibilityAttributes![key]]));
  }
  if (!Object.keys(body).length) return { ok: false, status: 400, message: "Tidak ada perubahan yang disimpan." };

  return adminApi<AdminPlace>(`/api/admin/places/${id}`, await adminAccessToken(true), { method: "PATCH", body });
}

export async function markAdminNotificationRead(form: FormData): Promise<void> {
  const id = String(form.get("notification_id") ?? "");
  if (!isUuid(id)) return;
  await adminApi(`/api/admin/notifications/${id}/read`, await adminAccessToken(true), { method: "PATCH" });
  refresh();
}
