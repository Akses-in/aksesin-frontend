import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { pendingChallenge } from "@/lib/whatsapp-otp";
import { Icon, Site } from "../_components/site";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Buat password" };

async function PasswordStep() {
  const pending = await pendingChallenge();
  if (!pending?.proof) redirect(pending ? "/verifikasi-otp" : "/register");

  return (
    <section className="panel page-stack verification-panel">
      <div className="page-heading">
        <p className="eyebrow">Langkah 3 dari 3</p>
        <h1>Buat password</h1>
        <p>Gunakan password ini bersama nomor WhatsApp untuk masuk ke Aksesin.</p>
      </div>
      <p className="notice icon-line">
        <Icon name="preferences-circle-check" size={20} />
        Nomor WhatsApp berakhiran {pending.phone.slice(-4)} sudah terverifikasi.
      </p>
      <PasswordForm />
      <Link className="inline-link icon-line" href="/register">Ubah nomor WhatsApp</Link>
    </section>
  );
}

export default function CreatePasswordPage() {
  return (
    <Site>
      <main id="konten" className="narrow-main" tabIndex={-1}>
        <Suspense fallback={<p className="loading" role="status">Memuat halaman…</p>}>
          <PasswordStep />
        </Suspense>
      </main>
    </Site>
  );
}
