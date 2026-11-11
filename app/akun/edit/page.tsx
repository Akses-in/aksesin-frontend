import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { preferencesFields, type Preferences } from "@/lib/preferences";
import { hasAccessibilityProfile } from "@/lib/profile";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { PreferencesForm } from "../../_components/preferences-form";
import { RetryButton } from "../../_components/retry-button";
import { Icon, Site } from "../../_components/site";
import { DeletePreferences } from "./delete-preferences";
import { NameForm, PhoneForm } from "./profile-forms";

export const metadata: Metadata = { title: "Edit profil dan preferensi" };

async function EditAccount({ params }: { params: PageProps<"/akun/edit">["searchParams"] }) {
  const { supabase, user } = await verifiedAccount();
  const { data, error } = await supabase.from("accessibility_preferences")
    .select(preferencesFields).eq("user_id", user.id).maybeSingle<Preferences>();
  const { hapus, tersimpan } = await params;
  const name = accountName(user);
  const phone = user.phone_confirmed_at && user.phone ? `+${user.phone.replace(/^\+/, "")}` : undefined;

  return (
    <Site name={name || "Akun"} variant="summary">
      <main id="konten" className="narrow-main page-stack" tabIndex={-1}>
        <div className="page-heading">
          <p className="eyebrow">Pengaturan akun</p>
          <h1>Edit profil dan preferensi</h1>
          <p>Ubah nama, nomor WhatsApp, dan kebutuhan aksesibilitasmu di satu tempat.</p>
        </div>

        {tersimpan === "preferensi" && (
          <p className="notice icon-line" role="status">
            <Icon name="summary-circle-check" size={20} />
            Kebutuhan aksesibilitas sudah disimpan.
          </p>
        )}
        {hapus === "berhasil" && (
          <p className="notice icon-line" role="status">
            <Icon name="summary-circle-check" size={20} />
            Data aksesibilitas sudah dihapus.
          </p>
        )}

        <section className="panel profile-sheet">
          <div className="profile-block">
            <div className="profile-block-head">
              <h2 className="profile-block-title"><Icon name="summary-user-round" size={20} />Data akun</h2>
            </div>
            <NameForm name={name} />
          </div>

          <div className="profile-block">
            <div className="profile-block-head">
              <h2 className="profile-block-title"><Icon name="register-shield-check" size={20} />Nomor WhatsApp</h2>
            </div>
            <PhoneForm phone={phone} />
          </div>

          <div className="profile-block">
            <div className="profile-block-head">
              <h2 className="profile-block-title"><Icon name="summary-sliders-horizontal" size={20} />Kebutuhan aksesibilitas</h2>
            </div>
            {error ? (
              <div className="page-stack">
                <p className="error" role="alert">Preferensi belum dapat dimuat. Coba lagi sebelum mengubah isian.</p>
                <RetryButton />
              </div>
            ) : (
              <>
                <PreferencesForm preferences={data} context="settings" />
                <p className="profile-note">
                  <Icon name="summary-lock-keyhole" size={16} />
                  Hanya kamu yang bisa melihat isian ini. Data tidak tampil di profil publik.
                </p>
              </>
            )}
          </div>
        </section>

        {!error && hasAccessibilityProfile(data) && <DeletePreferences />}

        <Link className="inline-link icon-line" href="/akun">Kembali ke profil saya</Link>
      </main>
    </Site>
  );
}

export default function EditAccountPage({ searchParams }: PageProps<"/akun/edit">) {
  return <Suspense fallback={<p className="loading" role="status">Memuat pengaturan akun…</p>}><EditAccount params={searchParams} /></Suspense>;
}
