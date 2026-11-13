import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { CredentialsForm } from "../_components/credentials-form";
import { Site } from "../_components/site";

export const metadata: Metadata = { title: "Masuk" };

async function SignInOptions({ params }: { params: PageProps<"/masuk">["searchParams"] }) {
  const { metode, terdaftar, verifikasi } = await params;
  const whatsapp = metode === "whatsapp";

  return (
    <>
      <div className="page-heading">
        <h1 id="login-title">{whatsapp ? "Masuk dengan WhatsApp" : "Selamat datang kembali"}</h1>
        <p>{whatsapp ? "Kami akan mengirim kode masuk ke nomor WhatsApp kamu." : "Masuk ke akun Aksesin dengan email dan password kamu."}</p>
      </div>
      {verifikasi === "1" && <p className="notice" role="status">Tautan verifikasi email tidak dapat digunakan.</p>}
      {whatsapp && terdaftar === "1" && <p className="notice" role="status">Nomor sudah terdaftar. Minta kode untuk masuk.</p>}
      <CredentialsForm key={whatsapp ? "whatsapp" : "email"} mode={whatsapp ? "whatsapp" : "email"} showAccountLink={false} />
      <div className="auth-divider"><span>atau masuk dengan</span></div>
      <nav className="auth-method" aria-label="Metode masuk">
        <Link className="button secondary" href={whatsapp ? "/masuk" : "/masuk?metode=whatsapp"}>
          {whatsapp ? "Email dan password" : "Nomor WhatsApp"}
        </Link>
      </nav>
      <p className="auth-account-link">Belum punya akun? <Link href={whatsapp ? "/register?metode=whatsapp" : "/register"}>Daftar sekarang</Link></p>
    </>
  );
}

export default function SignInPage({ searchParams }: PageProps<"/masuk">) {
  return (
    <Site>
      <main id="konten" className="register-main auth-main" tabIndex={-1}>
        <section className="register-card auth-card" aria-labelledby="login-title">
          <div className="register-art" aria-hidden="true">
            <Image src="/figma/register-illustration-artwork.png" alt="" width={784} height={838} priority unoptimized />
          </div>
          <div className="register-content auth-content">
            <Suspense fallback={<p role="status">Memuat pilihan masuk…</p>}><SignInOptions params={searchParams} /></Suspense>
          </div>
        </section>
      </main>
    </Site>
  );
}
