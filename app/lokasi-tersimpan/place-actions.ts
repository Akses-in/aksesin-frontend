"use server";

import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/place";
import { verifiedAccount } from "@/lib/supabase";

export type PlaceOption = {
  id: string;
  name: string;
  category: string;
  address: string;
};

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
  if (!isUuid(placeId)) return "Lokasi tidak dikenali. Pilih dari hasil pencarian.";
  const { supabase, user } = await verifiedAccount(true);

  const { error } = await supabase.from("saved_places")
    .upsert({ user_id: user.id, place_id: placeId }, { onConflict: "user_id,place_id", ignoreDuplicates: true });

  if (error) return "Lokasi belum dapat disimpan. Coba lagi.";
  revalidatePath("/lokasi-tersimpan");
  return "";
}

export async function removeSavedPlace(id: string) {
  if (!isUuid(id)) return "Lokasi tidak dikenali. Muat ulang halaman.";
  const { supabase, user } = await verifiedAccount(true);

  const { error } = await supabase.from("saved_places")
    .delete().eq("id", id).eq("user_id", user.id);

  if (error) return "Lokasi belum dapat dihapus. Coba lagi.";
  revalidatePath("/lokasi-tersimpan");
  return "";
}
