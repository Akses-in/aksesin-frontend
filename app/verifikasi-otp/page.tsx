import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { pendingChallenge } from "@/lib/whatsapp-otp";
import { FinishRegistration } from "./finish-registration";
import { Site } from "../_components/site";
import { OtpForm } from "./otp-form";

export const metadata: Metadata = { title: "Verifikasi WhatsApp" };

async function Verification({ params }: { params: PageProps<"/verifikasi-otp">["searchParams"] }) {
  const pending = await pendingChallenge();
  const phone = pending?.phone;
  const { kirim } = await params;
  return (
    <section className="panel page-stack verification-panel">
      <div className="page-heading">
        <h1>{pending?.proof ? "Selesaikan pendaftaran" : "Masukkan kode WhatsApp"}</h1>
        <p>{pending?.proof ? "Nomor WhatsApp sudah terverifikasi." : phone
          ? `Masukkan kode 6 digit yang dikirim ke nomor berakhiran ${phone.slice(-4)}.`
          : "Sesi verifikasi tidak tersedia. Kembali ke halaman daftar untuk meminta kode."}</p>
      </div>
      {phone && (
        <>
          {kirim === "1" && <p className="notice" role="status">Kode baru sudah dikirim. Periksa WhatsApp.</p>}
          {pending?.proof ? <FinishRegistration /> : <OtpForm submitLabel="Verifikasi dan buat akun" />}
        </>
      )}
      <Link className="inline-link icon-line" href="/register?metode=whatsapp">{phone ? "Ubah nomor WhatsApp" : "Ke halaman daftar"}</Link>
    </section>
  );
}

export default function VerifyOtpPage({ searchParams }: PageProps<"/verifikasi-otp">) {
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
