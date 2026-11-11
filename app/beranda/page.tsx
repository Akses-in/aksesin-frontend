import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { Site } from "../_components/site";

export const metadata: Metadata = { title: "Beranda" };

async function Home() {
  const { user } = await verifiedAccount();

  return (
    <Site name={accountName(user) || "Akun"} variant="summary" activePage="home">
      <main id="konten" className="narrow-main page-stack" tabIndex={-1}>
        <h1>Beranda</h1>
        <div className="panel button-row">
          <Link className="button primary" href="/lokasi-tersimpan">Lokasi tersimpan</Link>
          <Link className="button secondary" href="/kartu-aksesibilitas">Kartu aksesibilitas</Link>
        </div>
      </main>
    </Site>
  );
}

export default function HomePage() {
  return <Suspense fallback={<p className="loading" role="status">Memuat beranda…</p>}><Home /></Suspense>;
}
