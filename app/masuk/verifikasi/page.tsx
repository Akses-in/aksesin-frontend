import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { pendingChallenge } from "@/lib/whatsapp-otp";
import { resendSignInOtp, verifySignInOtp } from "../../actions";
import { Site } from "../../_components/site";
import { OtpForm } from "../../verifikasi-otp/otp-form";

export const metadata: Metadata = { title: "Verifikasi kode masuk" };

async function Verification({ params }: { params: PageProps<"/masuk/verifikasi">["searchParams"] }) {
  const pending = await pendingChallenge("login");
  const { kirim } = await params;

  return (
    <section className="panel page-stack verification-panel">
      <div className="page-heading">
        <p className="eyebrow">Langkah 2 dari 2</p>
        <h1>Masukkan kode WhatsApp</h1>
        <p>{pending
          ? `Masukkan kode 6 digit yang dikirim ke nomor berakhiran ${pending.phone.slice(-4)}.`
          : "Sesi verifikasi berakhir. Kembali ke halaman masuk untuk meminta kode."}</p>
      </div>
      {pending && (
        <>
          {kirim === "1" && <p className="notice" role="status">Kode baru sudah dikirim. Periksa WhatsApp.</p>}
          <OtpForm verifyAction={verifySignInOtp} resendAction={resendSignInOtp} submitLabel="Verifikasi dan masuk" />
        </>
      )}
      <Link className="inline-link" href="/masuk">{pending ? "Ubah nomor WhatsApp" : "Ke halaman masuk"}</Link>
    </section>
  );
}

export default function VerifySignInPage({ searchParams }: PageProps<"/masuk/verifikasi">) {
  return (
    <Site>
      <main id="konten" className="narrow-main" tabIndex={-1}>
        <Suspense fallback={<p className="loading" role="status">Memuat verifikasi…</p>}>
          <Verification params={searchParams} />
        </Suspense>
      </main>
    </Site>
  );
}
