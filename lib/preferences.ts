import { attributeLabels, type AccessibilityAttributes } from "./accessibility.ts";

export const disabilityOptions = [
  ["disabled", "Ya, saya penyandang disabilitas"],
  ["not_disabled", "Bukan penyandang disabilitas"],
  ["undisclosed", "Saya memilih tidak mengungkapkan"],
] as const;

export const accessibilityOptions = [
  ["step_free", "Akses tanpa tangga"],
  ["priority_seating", "Tempat duduk prioritas"],
  ["audio", "Panduan audio"],
  ["visual", "Informasi visual / teks"],
  ["companion", "Bantuan pendamping"],
  ["other", "Lainnya"],
  ["wheelchair", attributeLabels.wheelchair],
  ["toilets:wheelchair", attributeLabels["toilets:wheelchair"]],
  ["ramp", attributeLabels.ramp],
  ["elevator", attributeLabels.elevator],
  ["tactile_paving", attributeLabels.tactile_paving],
  ["capacity:disabled", attributeLabels["capacity:disabled"]],
] as const;

export const placeCategories = [
  "Pendidikan", "Kesehatan", "Transportasi", "Perbelanjaan", "Taman",
  "Layanan Publik", "Wisata dan Budaya", "Tempat Ibadah", "Lainnya",
] as const;

export type PlacePreferences = { needs: string[]; place_categories: string[] };

export function matchPlace(preferences: PlacePreferences, place: { category: string; accessibilityAttributes: AccessibilityAttributes }) {
  const category = place.category.trim().toLowerCase();
  const categoryMatches = preferences.place_categories.some((value) =>
    category === value.toLowerCase() || (value === "Perbelanjaan" && category === "pusat perbelanjaan"));
  const facilities = preferences.needs.flatMap((need, index) => {
    const option = accessibilityOptions.find(([value]) => value === need);
    if (!option) return [];

    const attributes = place.accessibilityAttributes;
    const value = (need === "ramp" ? attributes["ramp:wheelchair"] ?? attributes.ramp : attributes[need as keyof AccessibilityAttributes])
      ?.trim().toLowerCase();
    let status = "Belum ada data";
    if (value === "yes" || value === "designated" || (need === "capacity:disabled" && Number(value) > 0)) status = "Tersedia";
    else if (value === "limited") status = "Terbatas";
    else if (value === "no" || (need === "capacity:disabled" && value === "0")) status = "Tidak tersedia";
    return [{ need, label: option[1], weight: preferences.needs.length - index, status }];
  });
  const known = facilities.filter(({ status }) => status !== "Belum ada data");
  const total = facilities.reduce((sum, { weight }) => sum + weight, 0);
  const confirmed = known.reduce((sum, { weight, status }) => sum + (status === "Tersedia" ? weight : 0), 0);

  return {
    categoryMatches,
    facilities,
    score: known.length ? Math.round(100 * confirmed / total) : null,
  };
}

export type Preferences = {
  disability_status: string | null;
  needs: string[];
  notes: string;
  onboarding_skipped: boolean;
};

export const preferencesFields = "disability_status, needs, notes, onboarding_skipped";

export function validatePreferenceInput(status: string, needs: string[], notes: string) {
  if (status && !disabilityOptions.some(([value]) => value === status)) {
    return "Pilih status disabilitas yang tersedia.";
  }
  if (needs.some((need) => !accessibilityOptions.some(([value]) => value === need))) {
    return "Pilih kebutuhan aksesibilitas yang tersedia.";
  }
  if (Array.from(notes).length > 300) {
    return "Batasi deskripsi hingga 300 karakter.";
  }
  return "";
}
