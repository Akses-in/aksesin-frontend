import type { serverSupabase } from "./supabase";

export const savedPlaceLabelLimit = 100;
export const savedPlaceNoteLimit = 300;

export type PlaceOption = { id: string; name: string; category: string; address: string };

export type SavedPlace = PlaceOption & {
  savedId: string;
  label: string | null;
  note: string | null;
  createdAt: string;
};

export function savedPlaceActivity(place: SavedPlace) {
  return {
    id: place.savedId,
    type: "saved" as const,
    title: `Menyimpan ${place.label || place.name}`,
    subtitle: [place.label ? place.name : place.category, place.address].filter(Boolean).join(" · "),
    message: place.note ?? "",
    badge: "Lokasi tersimpan",
    badgeClass: "badge",
    created_at: place.createdAt,
  };
}

export async function readSavedPlaces(
  supabase: Awaited<ReturnType<typeof serverSupabase>>,
  userId: string,
) {
  const { data, error } = await supabase.from("saved_places")
    .select("id, label, note, created_at, place:places(id, name, category, address)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<Array<{ id: string; label: string | null; note: string | null; created_at: string; place: PlaceOption | null }>>();

  const places: SavedPlace[] = (data ?? []).flatMap((row) => row.place ? [{
    ...row.place,
    savedId: row.id,
    label: row.label,
    note: row.note,
    createdAt: row.created_at,
  }] : []);

  return { places, error };
}
