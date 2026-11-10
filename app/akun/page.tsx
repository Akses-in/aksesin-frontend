import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { preferencesFields, type Preferences } from "@/lib/preferences";
import {
  accessibilityProfileStatus,
  accountIdentity,
  disabilityLabel,
  hasAccessibilityProfile,
  needLabels,
} from "@/lib/profile";
import { RetryButton } from "../_components/retry-button";
import { Icon, Site } from "../_components/site";

export const metadata: Metadata = { title: "Profil dan kebutuhan aksesibilitas" };

function StatusCard({ category, title, status, active, children }: {
  category: string; title: string; status: string; active?: boolean; children: React.ReactNode;
}) {
  return (
    <section className="status-card">
      <div className="status-heading">
        <div><p className="small muted">{category}</p><h2>{title}</h2></div>
        <span className={active ? "badge active" : "badge"}>{status}</span>
      </div>
      {children}
    </section>
  );
}

async function Profile({ params }: { params: PageProps<"/akun">["searchParams"] }) {
  const { supabase, user } = await verifiedAccount();
  const { data, error } = await supabase.from("accessibility_preferences")
    .select(preferencesFields).eq("user_id", user.id).maybeSingle<Preferences>();
  const { keluar, tersimpan } = await params;
  const name = accountName(user);
  const identity = accountIdentity(user);
  const firstName = name.split(/\s+/)[0];
  const status = disabilityLabel(data?.disability_status ?? null);
  const needs = needLabels(data?.needs ?? []);
  const filled = hasAccessibilityProfile(data);
  const profileStatus = accessibilityProfileStatus(data);

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
          <div className="sidebar-note small muted">
            <Icon name="summary-lock-keyhole" size={18} />
            <p>Kamu yang menentukan data apa yang ingin dibagikan.</p>
          </div>
        </aside>
        <div className="page-stack">
          <div className="page-heading">
            <p className="eyebrow">Profil saya</p>
            <h1>Profil dan kebutuhan aksesibilitas</h1>
            <p>{firstName ? `Halo, ${firstName}. ` : ""}Di sini kamu bisa melihat data akun dan pilihan aksesibilitasmu.</p>
          </div>

          {(tersimpan === "nama" || tersimpan === "nomor") && (
            <p className="notice icon-line" role="status">
              <Icon name="summary-circle-check" size={20} />
              {tersimpan === "nama" ? "Nama sudah diperbarui." : "Nomor WhatsApp sudah diperbarui."}
            </p>
          )}
          {keluar === "gagal" && <p className="error" role="alert">Sesi belum dapat diakhiri. Coba keluar lagi.</p>}

          <StatusCard category="Data diri" title="Data akun" status="Terverifikasi" active>
            <dl className="account-details">
              <div><dt>Nama lengkap</dt><dd>{name || "Belum tersedia"}</dd></div>
              <div><dt>{identity.label}</dt><dd>{identity.value}</dd></div>
              <div><dt>Status onboarding</dt><dd>Selesai</dd></div>
            </dl>
            <p className="status-footnote small muted">Nama dan {identity.label.toLowerCase()} dipakai untuk masuk ke Aksesin.</p>
            <Link className="button secondary account-edit-link" href="/akun/edit">Edit data akun</Link>
          </StatusCard>

          {error ? (
            <section className="status-card">
              <h2>Data aksesibilitas belum dapat dimuat</h2>
              <p className="muted" role="alert">Data opsional belum dapat dibaca. Akunmu tetap dapat digunakan.</p>
              <RetryButton />
            </section>
          ) : (
            <StatusCard category="Opsional · hanya kamu" title="Kebutuhan aksesibilitas" status={profileStatus.label} active={profileStatus.filled}>
              {filled ? (
                <>
                  <dl className="preference-details">
                    {status && <div><dt>Status disabilitas</dt><dd>{status}</dd></div>}
                    {!!needs.length && (
                      <div>
                        <dt>Kebutuhan aksesibilitas</dt>
                        <dd className="badges">{needs.map((label) => <span className="badge active" key={label}>{label}</span>)}</dd>
                      </div>
                    )}
                    {data?.notes && <div><dt>Deskripsi kebutuhan</dt><dd className="saved-notes">{data.notes}</dd></div>}
                  </dl>
                  <p className="status-footnote small muted">Data ini hanya terlihat olehmu dan tidak tampil di profil publik.</p>
                </>
              ) : (
                <p className="muted">Belum ada data kebutuhan aksesibilitas. Bagian ini opsional dan tidak memengaruhi akses ke fitur publik.</p>
              )}
              <Link className="button secondary account-edit-link" href="/onboarding">
                {filled ? "Ubah kebutuhan aksesibilitas" : "Isi kebutuhan aksesibilitas"}
              </Link>
            </StatusCard>
          )}
        </div>
      </main>
    </Site>
  );
}

export default function AccountPage({ searchParams }: PageProps<"/akun">) {
  return <Suspense fallback={<p className="loading" role="status">Memuat profil…</p>}><Profile params={searchParams} /></Suspense>;
}
