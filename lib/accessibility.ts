export type AccessibilityStatus = "accessible" | "partial" | "unknown";

export const accessibilityAttributeKeys = [
  "wheelchair",
  "toilets:wheelchair",
  "ramp",
  "ramp:wheelchair",
  "elevator",
  "tactile_paving",
  "capacity:disabled",
  "wheelchair:description",
] as const;
export type AccessibilityAttributeKey = (typeof accessibilityAttributeKeys)[number];
export type AccessibilityAttributes = Partial<Record<AccessibilityAttributeKey, string>>;

type Badge = "badge" | "badge active" | "badge warning" | "badge danger";

// Nama status mengikuti legenda PRD: Accessible hijau, Partially Accessible kuning, Unknown abu-abu.
export const accessibilityStatusMeta: Record<AccessibilityStatus, { label: string; badge: Badge }> = {
  accessible: { label: "Accessible", badge: "badge active" },
  partial: { label: "Partially Accessible", badge: "badge warning" },
  unknown: { label: "Unknown", badge: "badge" },
};

export const attributeLabels: Record<AccessibilityAttributeKey, string> = {
  wheelchair: "Akses kursi roda",
  "toilets:wheelchair": "Toilet kursi roda",
  ramp: "Ramp",
  "ramp:wheelchair": "Ramp kursi roda",
  elevator: "Lift",
  tactile_paving: "Guiding block",
  "capacity:disabled": "Parkir disabilitas",
  "wheelchair:description": "Keterangan kursi roda",
};

const attributeValueLabels: Record<string, string> = {
  yes: "Ya",
  no: "Tidak",
  limited: "Terbatas",
  designated: "Khusus disabilitas",
};

export function attributeValueLabel(value: string) {
  return attributeValueLabels[value.toLowerCase()] ?? value;
}

export function osmUrl(place: { osmType: string | null; osmId: number | null }) {
  return place.osmType && place.osmId ? `https://www.openstreetmap.org/${place.osmType}/${place.osmId}` : null;
}
