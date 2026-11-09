import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { accessibilityOptions, disabilityOptions, preferencesFields, type Preferences } from "@/lib/preferences";
import { RetryButton } from "../_components/retry-button";
import { Icon, Site } from "../_components/site";

export const metadata: Metadata = { title: "Ringkasan akun & preferensi" };

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

async function Summary({ params }: { params: PageProps<"/akun">["searchParams"] }) {
  const { supabase, user } = await verifiedAccount();
  const { data, error } = await supabase.from("accessibility_preferences")
    .select(preferencesFields).eq("user_id", user.id).maybeSingle<Preferences>();
  const { keluar, tersimpan } = await params;
  const name = accountName(user);
  const hasVerifiedPhone = Boolean(user.phone && user.phone_confirmed_at);
  const firstName = name.split(/\s+/)[0];
  const status = disabilityOptions.find(([value]) => value === data?.disability_status);
  const needs = accessibilityOptions.filter(([value]) => data?.needs.includes(value));
  const hasPreferences = Boolean(needs.length || data?.notes);
  const empty = !status && !hasPreferences;

  return (
    <Site name={name || "Akun"} variant="summary">
      <main id="konten" className="site-width account-main" tabIndex={-1}>
        <aside className="account-sidebar">
          <p className="eyebrow muted">Pengaturan</p>
          <nav aria-label="Pengaturan akun">
            <Link className="icon-line current" aria-current="page" href="/akun"><Icon name="summary-user-round" size={20} />Akun & preferensi</Link>
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
            <div className="status-heading">
              <p className="eyebrow">Akun & preferensi</p>
              <p className="icon-line small muted"><Icon name="summary-eye" size={15} />Hanya lihat</p>
            </div>
            <h1>Ringkasan akun &amp; preferensi</h1>
            <p>{firstName ? `Halo, ${firstName}. ` : ""}Ini ringkasan akun, status onboarding, dan pilihan aksesibilitasmu.</p>
          </div>
          {(tersimpan === "nama" || tersimpan === "nomor") && (
            <p className="notice icon-line" role="status">
              <Icon name="summary-circle-check" size={20} />
              {tersimpan === "nama" ? "Nama sudah diperbarui." : "Nomor WhatsApp sudah diperbarui."}
            </p>
          )}
          {keluar === "gagal" && <p className="error" role="alert">Sesi belum dapat diakhiri. Coba keluar lagi.</p>}
          <div className="notice icon-line">
            <Icon name="summary-circle-check" size={20} />
            <div>
              <h2>{empty ? "Akunmu siap digunakan." : `Registrasi berhasil.${firstName ? ` Selamat datang, ${firstName}!` : ""}`}</h2>
              <p>Langkah wajib sudah selesai. Data disabilitas dan preferensi bersifat opsional.</p>
            </div>
          </div>

          {!empty && (
            <div className="section-intro">
              <h2>Ringkasan akun &amp; preferensi</h2>
              <p className="muted">Ringkasan ini menampilkan data akun, status onboarding, dan pilihan aksesibilitasmu.</p>
            </div>
          )}

          <StatusCard category="WAJIB · BUAT AKUN" title="Data akun & status onboarding" status="Selesai" active>
            <dl className="account-details">
              <div><dt>Nama lengkap</dt><dd>{name || "Belum tersedia"}</dd></div>
              <div><dt>{hasVerifiedPhone ? "Nomor WhatsApp" : "Email"}</dt><dd>{hasVerifiedPhone ? `+${user.phone?.replace(/^\+/, "")}` : user.email}</dd></div>
            </dl>
            <p className="status-footnote small muted">Registrasi selesai. {hasVerifiedPhone ? "Nomor WhatsApp" : "Email"} sudah terverifikasi.</p>
            <Link className="button secondary account-edit-link" href="/akun/edit">Edit data akun</Link>
          </StatusCard>

          {error ? (
            <section className="status-card">
              <h2>Status belum dapat dimuat</h2>
              <p className="muted" role="alert">Data opsional belum dapat dibaca. Akunmu tetap dapat digunakan.</p>
              <RetryButton />
            </section>
          ) : (
            <>
              {empty && (
                <div className="section-intro">
                  <h2 className="icon-line"><Icon name="skipped-leaf" size={20} />Data opsional</h2>
                  <p className="muted">Kamu belum memberikan informasi berikut. Ini opsional dan tidak ada kewajiban membukanya.</p>
                </div>
              )}
              <StatusCard category="OPSIONAL · PRIBADI" title="Data disabilitas" status={status ? "Tersimpan" : "Belum diberikan"} active={Boolean(status)}>
                {status ? (
                  <>
                    <dl><dt>Status disabilitas</dt><dd>{status[1]}</dd></dl>
                    <p className="small muted">Hanya terlihat olehmu di halaman akun ini.</p>
                  </>
                ) : <p className="muted">Status disabilitas belum diberikan. Kamu tetap bisa menggunakan akun tanpa mengungkapkannya.</p>}
              </StatusCard>
              <StatusCard category="OPSIONAL" title="Preferensi aksesibilitas" status={hasPreferences ? "Tersimpan" : data?.onboarding_skipped ? "Dilewati" : "Belum diberikan"} active={hasPreferences}>
                {hasPreferences ? (
                  <dl className="preference-details">
                    {!!needs.length && <div><dt>Kebutuhan aksesibilitas</dt><dd className="badges">{needs.map(([value, label]) => <span className="badge active" key={value}>{label}</span>)}</dd></div>}
                    {data?.notes && <div><dt>Deskripsi kebutuhan</dt><dd className="saved-notes">{data.notes}</dd></div>}
                  </dl>
                ) : <p className="muted">Kebutuhan aksesibilitas dan deskripsi belum diberikan. Kamu bisa menyesuaikannya kapan saja.</p>}
              </StatusCard>
              <section className="notice next-step">
                <h2 className="icon-line"><Icon name="summary-sliders-horizontal" size={18} />{empty ? "Kamu boleh membiarkannya seperti ini" : "Ingin menyesuaikan akun & preferensimu?"}</h2>
                <p>Hanya bagikan yang membuatmu nyaman. Akunmu tetap dapat digunakan tanpa data ini.</p>
                <Link className="inline-link icon-line" href="/onboarding">{empty ? "Buka preferensi opsional" : "Ubah preferensi"}<Icon name="summary-arrow-up-right" size={17} /></Link>
              </section>
            </>
          )}
        </div>
      </main>
    </Site>
  );
}

export default function AccountPage({ searchParams }: PageProps<"/akun">) {
  return <Suspense fallback={<p className="loading" role="status">Memuat ringkasan akun…</p>}><Summary params={searchParams} /></Suspense>;
}
