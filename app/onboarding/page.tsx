import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { preferencesFields, type Preferences } from "@/lib/preferences";
import { skipPreferences } from "../actions";
import { RetryButton } from "../_components/retry-button";
import { Icon, Site } from "../_components/site";
import { PreferencesForm } from "./preferences-form";

export const metadata: Metadata = { title: "Preferensi aksesibilitas" };

async function OnboardingContent({ params }: { params: PageProps<"/onboarding">["searchParams"] }) {
  const { supabase, user } = await verifiedAccount();
  const { data, error } = await supabase.from("accessibility_preferences")
    .select(preferencesFields).eq("user_id", user.id).maybeSingle<Preferences>();
  const { lewati } = await params;
  const firstName = accountName(user).split(/\s+/)[0];
  const editing = Boolean(data && !data.onboarding_skipped);

  return (
    <Site variant="preferences">
      <main id="konten" className="onboarding-main" tabIndex={-1}>
        <div className="onboarding-progress small">
          <p className="icon-line green"><Icon name="preferences-circle-check" size={20} />Akun berhasil dibuat</p>
          <p className="muted">{editing ? "Preferensi opsional" : "Langkah 2 dari 2 · Opsional"}</p>
        </div>
        <section className="panel page-stack">
          <div className="page-heading">
            <p className="eyebrow">Preferensi aksesibilitas</p>
            <h1>{editing ? "Ubah preferensi aksesibilitas" : "Pengalaman yang lebih sesuai untukmu"}</h1>
            <p>{firstName ? `Halo, ${firstName}. ` : ""}Bantu kami memahami kebutuhan aksesibilitasmu, hanya jika kamu merasa nyaman.</p>
          </div>
          <div className="notice icon-line">
            <Icon name="preferences-lock-keyhole" size={20} />
            <div>
              <h2>Informasi sensitif, pilihanmu sepenuhnya</h2>
              <p>Jawaban digunakan untuk menyesuaikan informasi aksesibilitas. Data ini tidak tampil di profil publik. Kamu dapat melihat, mengubah, atau menghapusnya di akunmu kapan saja.</p>
            </div>
          </div>
          {error ? (
            <div className="page-stack">
              <p className="error" role="alert">Preferensi belum dapat dimuat. Coba lagi sebelum mengubah isian.</p>
              <div className="button-row">
                <RetryButton />
                <Link className="button primary" href="/akun">Ke ringkasan akun</Link>
              </div>
            </div>
          ) : (
            <>
              <p className="icon-line small muted"><Icon name="preferences-info" size={15} />Semua isian bersifat opsional</p>
              {lewati === "gagal" && <p className="error" role="alert">Status belum tersimpan. Coba lewati lagi atau <Link href="/akun">buka ringkasan akun</Link>.</p>}
              <form id="skip-preferences" action={skipPreferences} />
              <PreferencesForm preferences={data} />
            </>
          )}
        </section>
        <p className="small muted">Tidak ingin menjawab? Tidak apa-apa. Kamu tetap mendapat akses ke Aksesin.</p>
      </main>
    </Site>
  );
}

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return <Suspense fallback={<p className="loading" role="status">Memuat preferensi…</p>}><OnboardingContent params={searchParams} /></Suspense>;
}
