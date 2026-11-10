import Image from "next/image";
import Link from "next/link";
import { accountName } from "@/lib/supabase";
import { Icon } from "../_components/site";
import { requireAdmin } from "./access";
import { signOutAdmin } from "./actions";
import { adminSections, type AdminSection } from "./sections";

export async function AdminWorkspace({
  section, logoutFailed = false,
}: {
  section?: AdminSection;
  logoutFailed?: boolean;
}) {
  const { admin } = await requireAdmin();
  const name = admin && accountName(admin);

  return (
    <>
      <a className="skip-link" href="#konten">Lewati ke konten</a>
      <header className="site-header">
        <div className="site-width site-bar admin-bar">
          <div className="admin-identity">
            <Link className="brand" href="/admin" prefetch={false}>
              <Image src="/figma/summary-aksesin-mark.svg" width={27} height={31} alt="" unoptimized />
              Aksesin
            </Link>
            <span className="admin-context">Admin</span>
          </div>
          <div className="admin-session">
            {name && <span className="small muted admin-name">{name}</span>}
            <form action={signOutAdmin}><button className="button secondary" type="submit">Keluar</button></form>
          </div>
        </div>
      </header>
      <div className="site-width admin-workspace">
        <nav className="admin-nav" aria-label="Navigasi admin">
          <p className="eyebrow muted">Ruang kerja</p>
          <Link href="/admin" prefetch={false} aria-current={!section ? "page" : undefined}>Ringkasan</Link>
          <p className="eyebrow muted admin-nav-group">Manajemen</p>
          {adminSections.map((item) => (
            <Link key={item.slug} href={`/admin/${item.slug}`} prefetch={false}
              aria-current={section?.slug === item.slug ? "page" : undefined}>{item.title}</Link>
          ))}
        </nav>
        <main id="konten" className="page-stack admin-content" tabIndex={-1}>
          <div className="page-heading">
            <h1>{section ? `Manajemen ${section.title.toLowerCase()}` : "Ringkasan admin"}</h1>
            <p>{section?.description ?? "Pilih bagian yang ingin kamu kelola."}</p>
          </div>
          {logoutFailed && <p className="error" role="alert">Sesi belum bisa diakhiri. Coba keluar lagi.</p>}
          {section ? (
            <section className="status-card admin-empty">
              <h2>Data belum terhubung</h2>
              <p className="muted">{section.next}</p>
              <Link className="inline-link icon-line" href="/admin" prefetch={false}>Kembali ke ringkasan</Link>
            </section>
          ) : (
            <section className="admin-directory" aria-labelledby="admin-directory-title">
              <h2 id="admin-directory-title">Menu manajemen</h2>
              <ul>
                {adminSections.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/admin/${item.slug}`} prefetch={false}>
                      <div><h3>{item.title}</h3><p>{item.description}</p></div>
                      <Icon name="summary-arrow-up-right" size={17} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
