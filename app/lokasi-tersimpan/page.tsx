import type { Metadata } from "next";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { RetryButton } from "../_components/retry-button";
import { Site } from "../_components/site";
import type { PlaceOption } from "./place-actions";
import { SavedPlaces, type SavedPlace } from "./saved-places";

export const metadata: Metadata = { title: "Lokasi tersimpan" };

async function SavedLocations() {
  const { supabase, user } = await verifiedAccount();
  const { data: savedRows, error: savedError } = await supabase
    .from("saved_places").select("id, place_id").eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const savedLinks = (savedRows ?? []) as Array<{ id: string; place_id: string }>;
  let loadFailed = Boolean(savedError);
  let savedPlaces: SavedPlace[] = [];

  if (!loadFailed && savedLinks.length) {
    const { data: placeRows, error: placesError } = await supabase.from("places")
      .select("id, name, category, address").in("id", savedLinks.map((row) => row.place_id));
    loadFailed = Boolean(placesError);
    const byId = new Map(((placeRows ?? []) as PlaceOption[]).map((place) => [place.id, place]));
    savedPlaces = savedLinks.flatMap((row) => {
      const place = byId.get(row.place_id);
      return place ? [{ savedId: row.id, ...place }] : [];
    });
  }

  return (
    <Site name={accountName(user) || "Akun"} variant="summary" activePage="saved-places">
      <main id="konten" className="narrow-main page-stack" tabIndex={-1}>
        <h1>Lokasi tersimpan</h1>
        <div className="panel page-stack">
          {loadFailed ? (
            <>
              <p className="error" role="alert">Lokasi tersimpan belum dapat dimuat.</p>
              <RetryButton />
            </>
          ) : (
            <SavedPlaces places={savedPlaces} />
          )}
        </div>
      </main>
    </Site>
  );
}

export default function SavedLocationsPage() {
  return (
    <Suspense fallback={<p className="loading" role="status">Memuat lokasi tersimpan…</p>}>
      <SavedLocations />
    </Suspense>
  );
}
