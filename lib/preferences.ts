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
] as const;

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
