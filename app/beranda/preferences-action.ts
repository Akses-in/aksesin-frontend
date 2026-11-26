"use server";

import { revalidatePath } from "next/cache";
import { placeCategories, validatePreferenceInput } from "@/lib/preferences";
import { verifiedAccount } from "@/lib/supabase";

export async function savePlacePreferences(form: FormData) {
  const { supabase, user } = await verifiedAccount(true);
  const needs = [...new Set(form.getAll("needs").map(String))];
  const categories = [...new Set(form.getAll("place_categories").map(String))];
  const invalid = validatePreferenceInput("", needs, "");
  if (invalid) return invalid;
  if (categories.some((category) => !placeCategories.some((option) => option === category))) {
    return "Pilih jenis tempat yang tersedia.";
  }

  const { error } = await supabase.from("accessibility_preferences").upsert({
    user_id: user.id,
    needs,
    place_categories: categories,
    ...(needs.length > 0 && { onboarding_skipped: false }),
  }, { defaultToNull: false });

  if (error) return "Preferensi belum tersimpan. Coba simpan lagi.";
  revalidatePath("/beranda");
  revalidatePath("/akun");
  revalidatePath("/akun/edit");
  return "";
}
