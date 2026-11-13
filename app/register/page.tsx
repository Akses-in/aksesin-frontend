import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CredentialsForm } from "../_components/credentials-form";
import { Site } from "../_components/site";

export const metadata: Metadata = { title: "Daftar akun" };

async function RegisterOptions({ params }: { params: PageProps<"/register">["searchParams"] }) {
  const { metode } = await params;
  const whatsapp = metode === "whatsapp";

  return (
    <>
      <div className="page-heading">
        <h1 id="register-title">{whatsapp ? "Daftar dengan WhatsApp" : "Daftar akun Aksesin"}</h1>
        <p>{whatsapp ? "Verifikasi nomor WhatsApp untuk membuat akun." : "Gunakan email untuk membuat akunmu."}</p>
      </div>
      <CredentialsForm key={whatsapp ? "whatsapp" : "email"} mode={whatsapp ? "register-whatsapp" : "register"} showAccountLink={false} />
      <div className="auth-divider"><span>atau daftar dengan</span></div>
      <nav className="auth-method" aria-label="Metode daftar">
        <Link className="button secondary" href={whatsapp ? "/register" : "/register?metode=whatsapp"}>
          {whatsapp ? "Email dan password" : "Nomor WhatsApp"}
        </Link>
      </nav>
      <p className="auth-account-link">Sudah punya akun? <Link href={whatsapp ? "/masuk?metode=whatsapp" : "/masuk"}>Masuk</Link></p>
    </>
  );
}

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <Site>
      <main id="konten" className="register-main auth-main" tabIndex={-1}>
        <section className="register-card auth-card" aria-labelledby="register-title">
          <div className="register-art">
            <Image src="/figma/register-illustration-artwork.png" alt="" width={784} height={838} priority unoptimized />
          </div>
          <div className="register-content auth-content">
            <Suspense fallback={<p role="status">Memuat formulir daftar…</p>}>
              <RegisterOptions params={searchParams} />
            </Suspense>
          </div>
        </section>
      </main>
    </Site>
  );
}
