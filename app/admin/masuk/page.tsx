import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Icon, Site } from "../../_components/site";
import { adminSession } from "../access";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk admin" };

async function Login() {
  const { admin } = await adminSession();
  if (admin) redirect("/admin");

  return (
    <section className="panel page-stack admin-login">
      <div className="page-heading">
        <div className="admin-lock" aria-hidden="true"><Icon name="preferences-lock-keyhole" size={20} /></div>
        <h1>Masuk admin</h1>
        <p>Gunakan email dan password akun admin Aksesin.</p>
      </div>
      <AdminLoginForm />
      <Link className="inline-link icon-line" href="/">Kembali ke Aksesin</Link>
    </section>
  );
}

export default function AdminLoginPage() {
  return (
    <Site>
      <main className="narrow-main admin-login-main" id="konten" tabIndex={-1}>
        <Suspense fallback={<p className="loading" role="status">Memuat halaman masuk…</p>}>
          <Login />
        </Suspense>
      </main>
    </Site>
  );
}
