import type { Metadata } from "next";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { Site } from "../_components/site";
import { AccessibilityMap } from "./place-layer";

export const metadata: Metadata = { title: "Beranda" };

async function Home() {
  const { user } = await verifiedAccount();

  return (
    <Site name={accountName(user) || "Akun"} variant="summary" activePage="home" showFooter={false}>
      <main id="konten" className="home-map" tabIndex={-1} aria-label="Peta Beranda">
        <AccessibilityMap center={[106.8224, -6.194]} zoom={16} label="Peta interaktif, tampilan awal Jakarta" />
      </main>
    </Site>
  );
}

export default function HomePage() {
  return <Suspense fallback={<p className="loading" role="status">Memuat beranda…</p>}><Home /></Suspense>;
}
