import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { Site } from "../../_components/site";
import { ProfileForms } from "./profile-forms";

export const metadata: Metadata = { title: "Edit data akun" };

async function EditAccount() {
  const { user } = await verifiedAccount();
  const name = accountName(user);
  const phone = user.phone_confirmed_at && user.phone ? `+${user.phone.replace(/^\+/, "")}` : undefined;

  return (
    <Site name={name || "Akun"} variant="summary">
      <main id="konten" className="narrow-main page-stack" tabIndex={-1}>
        <div className="page-heading">
          <p className="eyebrow">Pengaturan akun</p>
          <h1>Edit data akun</h1>
        </div>
        <ProfileForms name={name} phone={phone} />
        <Link className="inline-link icon-line" href="/akun">Kembali ke ringkasan akun</Link>
      </main>
    </Site>
  );
}

export default function EditAccountPage() {
  return <Suspense fallback={<p className="loading" role="status">Memuat pengaturan akun…</p>}><EditAccount /></Suspense>;
}
