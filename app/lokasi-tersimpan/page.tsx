import type { Metadata } from "next";
import { Suspense } from "react";
import { readSavedPlaces } from "@/lib/saved-places";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { RetryButton } from "../_components/retry-button";
import { Site } from "../_components/site";
import { SavedPlaces } from "./saved-places";

export const metadata: Metadata = { title: "Lokasi tersimpan" };

async function SavedLocations() {
  const { supabase, user } = await verifiedAccount();
  const { places, error } = await readSavedPlaces(supabase, user.id);

  return (
    <Site name={accountName(user) || "Akun"} variant="summary" activePage="saved-places">
      <main id="konten" className="narrow-main page-stack" tabIndex={-1}>
        <h1>Lokasi tersimpan</h1>
        <div className="panel page-stack">
          {error ? (
            <>
              <p className="error" role="alert">Lokasi tersimpan belum dapat dimuat.</p>
              <RetryButton />
            </>
          ) : (
            <SavedPlaces places={places} />
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
