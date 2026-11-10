"use server";

import { revalidatePath } from "next/cache";
import { verifiedAccount } from "@/lib/supabase";

export type PlaceOption = {
  id: string;
  name: string;
  category: string;
  address: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  if (!uuidPattern.test(placeId)) return "Lokasi tidak dikenali. Pilih dari hasil pencarian.";
  const { supabase, user } = await verifiedAccount(true);

  const { error } = await supabase.from("saved_places")
    .upsert({ user_id: user.id, place_id: placeId }, { onConflict: "user_id,place_id", ignoreDuplicates: true });

  if (error) return "Lokasi belum dapat disimpan. Coba lagi.";
  revalidatePath("/akun");
  return "";
}

export async function removeSavedPlace(id: string) {
  if (!uuidPattern.test(id)) return "Lokasi tidak dikenali. Muat ulang halaman.";
  const { supabase, user } = await verifiedAccount(true);

  const { error } = await supabase.from("saved_places")
    .delete().eq("id", id).eq("user_id", user.id);

  if (error) return "Lokasi belum dapat dihapus. Coba lagi.";
  revalidatePath("/akun");
  return "";
}
