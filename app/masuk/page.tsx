import type { Metadata } from "next";
import { Suspense } from "react";
import { CredentialsForm } from "../_components/credentials-form";
import { Site } from "../_components/site";

export const metadata: Metadata = { title: "Masuk" };

async function VerificationMessage({ params }: { params: PageProps<"/masuk">["searchParams"] }) {
  const { verifikasi } = await params;
  return verifikasi === "1" ? (
    <p className="notice" role="status">Tautan verifikasi email tidak dapat digunakan.</p>
  ) : null;
}

export default function SignInPage({ searchParams }: PageProps<"/masuk">) {
  return (
    <Site>
      <main id="konten" className="narrow-main" tabIndex={-1}>
        <section className="panel page-stack">
          <div className="page-heading"><h1>Masuk ke Aksesin</h1></div>
          <Suspense><VerificationMessage params={searchParams} /></Suspense>
          <CredentialsForm login />
        </section>
      </main>
    </Site>
  );
}
