import type { Metadata } from "next";
import { Suspense } from "react";
import type { PlacePreferences } from "@/lib/preferences";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { Site } from "../_components/site";
import { AccessibilityMap } from "./place-layer";

export const metadata: Metadata = { title: "Beranda" };

async function Home() {
  const { supabase, user } = await verifiedAccount();
  const [{ data }, preferences] = await Promise.all([
    supabase.from("saved_places").select("place_id").eq("user_id", user.id),
    supabase.from("accessibility_preferences").select("needs, place_categories").eq("user_id", user.id)
      .maybeSingle<PlacePreferences>(),
  ]);
  const savedPlaceIds = (data ?? []).map(({ place_id }) => String(place_id));

  return (
    <Site name={accountName(user) || "Akun"} variant="summary" activePage="home" showFooter={false}>
      <main id="konten" className="home-map" tabIndex={-1} aria-label="Peta Beranda">
        <AccessibilityMap center={[106.8224, -6.194]} zoom={16} label="Peta interaktif, tampilan awal Jakarta"
          savedPlaceIds={savedPlaceIds} preferences={preferences.data ?? { needs: [], place_categories: [] }}
          preferencesUnavailable={Boolean(preferences.error)} />
      </main>
    </Site>
  );
}

export default function HomePage() {
  return <Suspense fallback={<p className="loading" role="status">Memuat beranda…</p>}><Home /></Suspense>;
}
