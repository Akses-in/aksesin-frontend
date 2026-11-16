"use server";

import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/place";
import { savedPlaceLabelLimit, savedPlaceNoteLimit, type PlaceOption } from "@/lib/saved-places";
import { verifiedAccount } from "@/lib/supabase";

function refreshSavedPlaces() {
  revalidatePath("/beranda");
  revalidatePath("/lokasi-tersimpan");
  revalidatePath("/akun");
  revalidatePath("/riwayat-aktivitas");
}

export async function searchPlaces(query: string): Promise<PlaceOption[]> {
  const { supabase } = await verifiedAccount(true);
  const value = query.trim().replace(/[%_\\]/g, "").slice(0, 60);
  if (value.length < 2) return [];

  const { data, error } = await supabase.from("places")
    .select("id, name, category, address")
    .ilike("name", `%${value}%`)
    .order("name")
    .limit(5);

  if (error) return [];
  return (data ?? []) as PlaceOption[];
}

export async function addSavedPlace(placeId: string) {
  if (!isUuid(placeId)) return "Lokasi tidak dikenali. Pilih lokasi lagi.";
  const { supabase, user } = await verifiedAccount(true);

  const { error } = await supabase.from("saved_places")
    .upsert({ user_id: user.id, place_id: placeId }, { onConflict: "user_id,place_id", ignoreDuplicates: true });

  if (error) return "Lokasi belum dapat disimpan. Coba lagi.";
  refreshSavedPlaces();
  return "";
}

export async function updateSavedPlace(id: string, form: FormData) {
  if (!isUuid(id)) return "Lokasi tidak dikenali. Muat ulang halaman.";
  const label = form.get("label");
  const note = form.get("note");
  if (typeof label !== "string" || typeof note !== "string") return "Isian belum valid.";
  const trimmedLabel = label.trim();
  const trimmedNote = note.trim();
  if (trimmedLabel.length > savedPlaceLabelLimit || trimmedNote.length > savedPlaceNoteLimit) {
    return `Nama simpanan maksimal ${savedPlaceLabelLimit} karakter dan catatan maksimal ${savedPlaceNoteLimit} karakter.`;
  }

  const { supabase, user } = await verifiedAccount(true);
  const { data, error } = await supabase.from("saved_places")
    .update({ label: trimmedLabel || null, note: trimmedNote || null })
    .eq("id", id).eq("user_id", user.id).select("id").maybeSingle();

  if (error) return "Perubahan belum dapat disimpan. Coba lagi.";
  if (!data) {
    refreshSavedPlaces();
    return "Simpanan tidak ditemukan.";
  }
  refreshSavedPlaces();
  return "";
}

export async function removeSavedPlace(id: string) {
  if (!isUuid(id)) return "Lokasi tidak dikenali. Muat ulang halaman.";
  const { supabase, user } = await verifiedAccount(true);

  const { error } = await supabase.from("saved_places")
    .delete().eq("id", id).eq("user_id", user.id);

  if (error) return "Lokasi belum dapat dihapus. Coba lagi.";
  refreshSavedPlaces();
  return "";
}
