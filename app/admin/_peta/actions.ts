"use server";

import { revalidatePath } from "next/cache";
import { adminAccessToken, adminApi } from "../_impor-osm/backend";

export async function createManualPlaceAction(formData: FormData) {
  const token = await adminAccessToken(true);
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const accessibilityStatus = String(formData.get("accessibilityStatus") ?? "unknown").trim();

  if (!name || !category || !address) {
    return { ok: false, message: "Nama, kategori, dan alamat wajib diisi." };
  }

  const accessibilityAttributes: Record<string, string> = {};
  const attributeKeys = [
    "wheelchair",
    "ramp",
    "elevator",
    "toilets:wheelchair",
    "capacity:disabled",
    "tactile_paving",
  ];

  for (const key of attributeKeys) {
    const val = formData.get(key);
    if (val && typeof val === "string") {
      accessibilityAttributes[key] = val;
    }
  }

  const payload: Record<string, unknown> = {
    name,
    category,
    address,
    accessibilityStatus,
    accessibilityAttributes,
  };

  const result = await adminApi("/api/admin/places", token, {
    method: "POST",
    body: payload,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/admin/peta");
  revalidatePath("/beranda");
  return { ok: true };
}

export async function updateManualPlaceAction(id: string, formData: FormData) {
  const token = await adminAccessToken(true);
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const accessibilityStatus = String(formData.get("accessibilityStatus") ?? "").trim();

  const accessibilityAttributes: Record<string, string> = {};
  const attributeKeys = [
    "wheelchair",
    "ramp",
    "elevator",
    "toilets:wheelchair",
    "capacity:disabled",
    "tactile_paving",
  ];

  for (const key of attributeKeys) {
    const val = formData.get(key);
    if (val && typeof val === "string") {
      accessibilityAttributes[key] = val;
    }
  }

  const payload: Record<string, unknown> = {
    accessibilityAttributes,
  };
  if (name) payload.name = name;
  if (category) payload.category = category;
  if (address) payload.address = address;
  if (accessibilityStatus) payload.accessibilityStatus = accessibilityStatus;

  const result = await adminApi(`/api/admin/places/${id}`, token, {
    method: "PATCH",
    body: payload,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/admin/peta");
  revalidatePath("/beranda");
  return { ok: true };
}

export async function deleteManualPlaceAction(id: string) {
  const token = await adminAccessToken(true);
  const result = await adminApi(`/api/admin/places/${id}`, token, {
    method: "DELETE",
    body: { reason: "invalid" },
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/admin/peta");
  revalidatePath("/beranda");
  return { ok: true };
}
