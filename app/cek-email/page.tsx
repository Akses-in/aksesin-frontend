import type { Metadata } from "next";
import Link from "next/link";
import { Site } from "../_components/site";

export const metadata: Metadata = { title: "Cek email" };

export default function CheckEmailPage() {
  return (
    <Site>
      <main id="konten" className="narrow-main" tabIndex={-1}>
        <section className="panel page-stack">
          <div className="page-heading">
            <h1>Cek emailmu</h1>
            <p>Jika pendaftaran dapat diproses, kami akan mengirim tautan verifikasi. Buka tautan itu untuk melanjutkan ke preferensi aksesibilitas.</p>
          </div>
          <Link className="button primary" href="/masuk">Ke halaman masuk</Link>
        </section>
      </main>
    </Site>
  );
}
