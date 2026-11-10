import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { preferencesFields, type Preferences } from "@/lib/preferences";
import {
  accountIdentity,
  disabilityLabel,
  hasAccessibilityProfile,
  needLabels,
  onboardingStatus,
} from "@/lib/profile";
import { RetryButton } from "../_components/retry-button";
import { Icon, Site } from "../_components/site";

export const metadata: Metadata = { title: "Profil dan kebutuhan aksesibilitas" };

async function Profile({ params }: { params: PageProps<"/akun">["searchParams"] }) {
  const { supabase, user } = await verifiedAccount();
  const { data, error } = await supabase.from("accessibility_preferences")
    .select(preferencesFields).eq("user_id", user.id).maybeSingle<Preferences>();
  const { keluar, tersimpan } = await params;
  const name = accountName(user);
  const identity = accountIdentity(user);
  const status = disabilityLabel(data?.disability_status ?? null);
  const needs = needLabels(data?.needs ?? []);
  const filled = hasAccessibilityProfile(data);

  return (
    <Site name={name || "Akun"} variant="summary">
      <main id="konten" className="site-width account-main" tabIndex={-1}>
        <aside className="account-sidebar">
          <p className="eyebrow muted">Pengaturan</p>
          <nav aria-label="Pengaturan akun">
            <Link className="icon-line current" aria-current="page" href="/akun"><Icon name="summary-user-round" size={20} />Profil saya</Link>
            <Link className="icon-line" href="/kartu-aksesibilitas"><Icon name="register-shield-check" size={20} />Kartu aksesibilitas</Link>
            <Link className="icon-line" href="/bantuan"><Icon name="summary-circle-help" size={20} />Bantuan</Link>
          </nav>
          <Link className="sidebar-privacy" href="/privasi">
            <Icon name="summary-lock-keyhole" size={18} />
            Kebijakan privasi
          </Link>
        </aside>

        <div className="page-stack">
          <div className="page-heading">
            <h1 className="profile-title">{name || "Profil saya"}</h1>
            <p className="profile-meta">
              <span>{identity.label} {identity.value}</span>
              <span className="profile-verified"><Icon name="summary-circle-check" size={16} />Terverifikasi</span>
            </p>
          </div>

          {(tersimpan === "nama" || tersimpan === "nomor") && (
            <p className="notice icon-line" role="status">
              <Icon name="summary-circle-check" size={20} />
              {tersimpan === "nama" ? "Nama sudah diperbarui." : "Nomor WhatsApp sudah diperbarui."}
            </p>
          )}
          {keluar === "gagal" && <p className="error" role="alert">Sesi belum dapat diakhiri. Coba keluar lagi.</p>}

          <section className="panel profile-sheet">
            <div className="profile-block">
              <div className="profile-block-head">
                <h2 className="profile-block-title"><Icon name="summary-user-round" size={20} />Data akun</h2>
                <Link className="profile-action" href="/akun/edit" aria-label="Ubah data akun">Ubah</Link>
              </div>
              <dl className="profile-facts">
                <div className="profile-fact"><dt>Nama lengkap</dt><dd>{name || "Belum tersedia"}</dd></div>
                <div className="profile-fact"><dt>{identity.label}</dt><dd>{identity.value || "Belum tersedia"}</dd></div>
                <div className="profile-fact"><dt>Status onboarding</dt><dd>{error ? "Belum dapat dimuat" : onboardingStatus(data)}</dd></div>
              </dl>
            </div>

            <div className="profile-block">
              <div className="profile-block-head">
                <h2 className="profile-block-title"><Icon name="summary-sliders-horizontal" size={20} />Kebutuhan aksesibilitas</h2>
                <Link className="profile-action" href="/onboarding"
                  aria-label={filled ? "Ubah kebutuhan aksesibilitas" : "Isi kebutuhan aksesibilitas"}>
                  {filled ? "Ubah" : "Isi"}
                </Link>
              </div>

              {error ? (
                <div className="page-stack">
                  <p className="error" role="alert">Data opsional belum dapat dimuat. Akunmu tetap bisa dipakai.</p>
                  <RetryButton />
                </div>
              ) : filled ? (
                <>
                  <dl className="profile-facts stacked">
                    {status && <div className="profile-fact"><dt>Status disabilitas</dt><dd>{status}</dd></div>}
                    {!!needs.length && (
                      <div className="profile-fact">
                        <dt>Kebutuhan</dt>
                        <dd>
                          <ul className="profile-tags">
                            {needs.map((label) => <li className="profile-tag" key={label}>{label}</li>)}
                          </ul>
                        </dd>
                      </div>
                    )}
                    {data?.notes && <div className="profile-fact wide"><dt>Catatan</dt><dd className="saved-notes">{data.notes}</dd></div>}
                  </dl>
                  <p className="profile-note"><Icon name="summary-lock-keyhole" size={16} />
                    Hanya kamu yang bisa melihat isian ini. Data tidak tampil di profil publik.</p>
                </>
              ) : (
                <p className="muted">
                  {data?.onboarding_skipped
                    ? "Kamu melewati bagian ini saat onboarding. Isi kapan saja kalau berubah pikiran."
                    : "Belum diisi. Bagian ini opsional dan tidak memengaruhi akses ke fitur publik."}
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </Site>
  );
}

export default function AccountPage({ searchParams }: PageProps<"/akun">) {
  return <Suspense fallback={<p className="loading" role="status">Memuat profil…</p>}><Profile params={searchParams} /></Suspense>;
}
