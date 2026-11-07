import type { Metadata } from "next";
import Image from "next/image";
import { CredentialsForm } from "../_components/credentials-form";
import { Site } from "../_components/site";

export const metadata: Metadata = { title: "Daftar akun" };

export default function RegisterPage() {
  return (
    <Site>
      <main id="konten" className="register-main" tabIndex={-1}>
        <section className="register-card" aria-labelledby="register-title">
          <div className="register-art">
            <Image src="/figma/register-illustration-artwork.png" alt="" width={784} height={838} priority unoptimized />
          </div>
          <div className="register-content">
            <ol className="progress" aria-label="Tahapan registrasi">
              <li aria-current="step"><span>1</span> Nomor WhatsApp</li>
              <li>2 Verifikasi</li>
              <li>3 Password</li>
            </ol>
            <div className="page-heading">
              <h1 id="register-title">Selamat datang di Aksesin</h1>
              <p>Buat akunmu. Tentukan sendiri informasi yang ingin kamu bagikan.</p>
            </div>
            <CredentialsForm />
          </div>
        </section>
      </main>
    </Site>
  );
}
