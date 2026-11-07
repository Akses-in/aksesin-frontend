import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { pendingChallenge } from "@/lib/whatsapp-otp";
import { Site } from "../../_components/site";
import { OtpForm } from "../../verifikasi-otp/otp-form";
import { resendPhoneChangeOtp, verifyPhoneChange } from "../actions";

export const metadata: Metadata = { title: "Verifikasi nomor baru" };

async function VerifyNumber({ params }: { params: PageProps<"/akun/verifikasi-nomor">["searchParams"] }) {
  const { user } = await verifiedAccount();
  const pending = await pendingChallenge("phoneChange");
  if (!pending) redirect("/akun/edit");
  const { kirim } = await params;

  return (
    <Site name={accountName(user) || "Akun"} variant="summary">
      <main id="konten" className="narrow-main" tabIndex={-1}>
        <section className="panel page-stack verification-panel">
          <div className="page-heading">
            <p className="eyebrow">Pengaturan akun</p>
            <h1>Verifikasi nomor baru</h1>
            <p>Masukkan kode 6 digit yang dikirim ke nomor berakhiran {pending.phone.slice(-4)}.</p>
          </div>
          {kirim === "1" && <p className="notice" role="status">Kode baru sudah dikirim. Periksa WhatsApp.</p>}
          <OtpForm verifyAction={verifyPhoneChange} resendAction={resendPhoneChangeOtp} submitLabel="Verifikasi dan simpan nomor" />
          <Link className="inline-link icon-line" href="/akun/edit">Kembali ke edit akun</Link>
        </section>
      </main>
    </Site>
  );
}

export default function VerifyNumberPage({ searchParams }: PageProps<"/akun/verifikasi-nomor">) {
  return <Suspense fallback={<p className="loading" role="status">Memuat verifikasi…</p>}><VerifyNumber params={searchParams} /></Suspense>;
}
