import Image from "next/image";
import Link from "next/link";
import { signOut } from "../actions";

export function Icon({ name, size }: { name: string; size: number }) {
  return <Image src={`/figma/${name}.svg`} width={size} height={size} alt="" unoptimized />;
}

export function Site({
  children, name, variant = "register", activePage,
}: {
  children: React.ReactNode;
  name?: string;
  variant?: "register" | "preferences" | "summary";
  activePage?: "home" | "saved-places";
}) {
  const initials = name?.split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("");

  return (
    <>
      <a className="skip-link" href="#konten">Lewati ke konten</a>
      <header className="site-header">
        <div className={`site-width site-bar${name ? " signed-in" : ""}`}>
          <Link className="brand" href={name ? "/beranda" : "/"}>
            <Image src={`/figma/${variant}-aksesin-mark.svg`} width={27} height={31} alt="" unoptimized />
            Aksesin
          </Link>
          <nav className="site-links" aria-label="Navigasi utama">
            {name && (
              <>
                <Link href="/beranda" aria-current={activePage === "home" ? "page" : undefined}>Beranda</Link>
                <Link href="/lokasi-tersimpan" aria-current={activePage === "saved-places" ? "page" : undefined}>Lokasi tersimpan</Link>
              </>
            )}
            <Link href="/bantuan">Pusat bantuan</Link>
            {!name && <Link className="green" href="/privasi">Privasi</Link>}
          </nav>
          {name && (
            <details className="account-menu">
              <summary><span className="avatar" aria-hidden="true">{initials}</span><span>{name}</span><Icon name="summary-chevron-down" size={16} /></summary>
              <div className="account-menu-panel">
                <Link href="/akun">Profil saya</Link>
                <form action={signOut}><button type="submit">Keluar</button></form>
              </div>
            </details>
          )}
        </div>
      </header>
      {children}
      <footer className="site-width site-footer">
        <p>© 2026 Aksesin. Akses untuk semua.</p>
        <nav aria-label="Informasi situs">
          <Link href="/privasi">Kebijakan Privasi</Link>
          <span aria-hidden="true">·</span>
          <Link href="/ketentuan">Ketentuan Penggunaan</Link>
        </nav>
      </footer>
    </>
  );
}
