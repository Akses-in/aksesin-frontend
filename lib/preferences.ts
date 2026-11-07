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
