import { accessibilityOptions, disabilityOptions, type Preferences } from "./preferences";

export type AccountIdentitySource = {
  email?: string | null;
  phone?: string | null;
  phone_confirmed_at?: string | null;
};

export function disabilityLabel(value: string | null) {
  return disabilityOptions.find(([option]) => option === value)?.[1] ?? null;
}

export function needLabels(needs: string[]) {
  return accessibilityOptions
    .filter(([option]) => needs.includes(option))
    .map(([, label]) => label);
}

export function hasAccessibilityProfile(preferences: Preferences | null) {
  if (!preferences) return false;
  return Boolean(preferences.disability_status || preferences.needs.length || preferences.notes);
}

export function onboardingStatus(preferences: Preferences | null) {
  if (!preferences) return "Belum diisi";
  if (preferences.onboarding_skipped && !hasAccessibilityProfile(preferences)) return "Dilewati";
  return "Selesai";
}

export function accountIdentity(user: AccountIdentitySource) {
  if (user.phone && user.phone_confirmed_at) {
    return { label: "Nomor WhatsApp", value: `+${user.phone.replace(/^\+/, "")}` };
  }
  return { label: "Email", value: user.email ?? "" };
}
