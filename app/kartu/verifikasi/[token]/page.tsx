import { ArrowLeft, Clock, Lock, ShieldCheck, ShieldX } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { RetryButton } from "../../../_components/retry-button";
import { Site } from "../../../_components/site";
import { formatWib } from "../../../admin/_impor-osm/labels";
import "./verify-card.css";

export const metadata: Metadata = {
  title: "Verifikasi Digital Accessibility Card",
  robots: { index: false, follow: false },
};

type PublicCardVerifyResult = {
  valid: boolean;
  state: "active" | "expired" | "revoked";
  statusLabel: string;
  cardNumber: string;
  holderName: string | null;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

const tokenPattern = /^[A-Za-z0-9_-]{32,128}$/;

function formatCardDateWib(iso: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function verifyCardToken(token: string): Promise<
  | { ok: true; data: PublicCardVerifyResult }
  | { ok: false; notFound: boolean; message: string }
> {
  if (!tokenPattern.test(token)) {
    return { ok: false, notFound: true, message: "Kode QR kartu tidak valid." };
  }
  const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";
  try {
    const response = await fetch(new URL(`/api/cards/verify/${encodeURIComponent(token)}`, backend), {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const body = (await response.json().catch(() => null)) as {
      data?: PublicCardVerifyResult;
      error?: { message?: string };
    } | null;
    if (!response.ok || !body?.data) {
      return {
        ok: false,
        notFound: response.status === 404,
        message: body?.error?.message ?? "Data kartu tidak ditemukan.",
      };
    }
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, notFound: false, message: "Server verifikasi belum dapat dihubungi." };
  }
}

const visualStateConfig = {
  active: {
    label: "Aktif / Valid",
    banner: "Kartu ini aktif, sah, dan telah diverifikasi oleh tim Aksesin.",
    Icon: ShieldCheck,
  },
  expired: {
    label: "Kedaluwarsa",
    banner: "Masa berlaku kartu ini telah habis dan tidak lagi berstatus aktif.",
    Icon: Clock,
  },
  revoked: {
    label: "Dicabut / Tidak Aktif",
    banner: "Kartu ini telah dicabut dan tidak lagi berlaku untuk verifikasi.",
    Icon: ShieldX,
  },
} as const;

async function VerificationContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyCardToken(token);

  if (!result.ok) {
    return (
      <Site>
        <main id="konten" className="verify-card-main page-stack" tabIndex={-1}>
          <div className="page-heading">
            <p className="eyebrow">VERIFIKASI KARTU DIGITAL</p>
            <h1>Status Digital Accessibility Card</h1>
            <p className="muted">
              Halaman ini hanya menampilkan status keabsahan kartu tanpa membuka dokumen verifikasi atau catatan medis pemilik.
            </p>
          </div>

          <section className="status-card" aria-labelledby="verify-error-title">
            <div>
              <span className="badge danger" role="status">Tidak valid</span>
            </div>
            <h2 id="verify-error-title">{result.notFound ? "Kartu tidak ditemukan" : "Verifikasi gagal"}</h2>
            <p className="error" role="alert">{result.message}</p>
            <div className="verify-card-actions">
              {!result.notFound && <RetryButton />}
              <Link className="button secondary" href="/beranda">
                <ArrowLeft size={16} aria-hidden="true" />
                Kembali ke beranda AksesIn
              </Link>
            </div>
          </section>
        </main>
      </Site>
    );
  }

  const card = result.data;
  const visualState = card.valid ? "active" : card.state === "expired" ? "expired" : "revoked";
  const stateMeta = visualStateConfig[visualState];
  const StateIcon = stateMeta.Icon;

  return (
    <Site>
      <main id="konten" className="verify-card-main page-stack" tabIndex={-1}>
        <div className="page-heading">
          <p className="eyebrow">VERIFIKASI KARTU DIGITAL</p>
          <h1>Digital Accessibility Card</h1>
          <p className="muted">
            Hasil pemindaian QR resmi untuk memeriksa keabsahan kartu aksesibilitas digital di Aksesin.
          </p>
        </div>

        <article className={`dac-card dac-card--${visualState}`} aria-labelledby="dac-card-title">
          <header className="dac-card-header">
            <div className="dac-brand">
              <div className="dac-brand-mark" aria-hidden="true">
                <Image src="/figma/summary-aksesin-mark.svg" width={26} height={30} alt="" unoptimized />
              </div>
              <div className="dac-brand-text">
                <span className="dac-brand-name">Aksesin</span>
                <span id="dac-card-title" className="dac-brand-subtitle">Digital Accessibility Card</span>
              </div>
            </div>

            <span className={`dac-status-badge dac-status-badge--${visualState}`} role="status">
              <StateIcon size={16} aria-hidden="true" />
              {stateMeta.label}
            </span>
          </header>

          <div
            className={`dac-status-banner dac-status-banner--${visualState}`}
            role={card.valid ? "status" : "alert"}
          >
            <StateIcon size={18} aria-hidden="true" />
            <span>{stateMeta.banner}</span>
          </div>

          <div className="dac-card-body">
            <div className="dac-card-identity">
              <div>
                <p className="dac-field-label">Nama Pemilik</p>
                {card.holderName ? (
                  <p className="dac-holder-name">{card.holderName}</p>
                ) : (
                  <p className="dac-holder-name dac-holder-name--hidden">
                    Disembunyikan (kartu tidak aktif)
                  </p>
                )}
              </div>

              <div>
                <p className="dac-field-label">Nomor Kartu Digital</p>
                <p className="dac-card-number">{card.cardNumber}</p>
              </div>

              <dl className="dac-dates">
                <div>
                  <dt>Tanggal Diterbitkan</dt>
                  <dd>
                    <time dateTime={card.issuedAt} title={formatWib(card.issuedAt)}>
                      {formatCardDateWib(card.issuedAt)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt>Berlaku Hingga</dt>
                  <dd>
                    <time dateTime={card.expiresAt} title={formatWib(card.expiresAt)}>
                      {formatCardDateWib(card.expiresAt)}
                    </time>
                  </dd>
                </div>
                {card.revokedAt && (
                  <div>
                    <dt>Dicabut Pada</dt>
                    <dd>
                      <time dateTime={card.revokedAt} title={formatWib(card.revokedAt)}>
                        {formatCardDateWib(card.revokedAt)}
                      </time>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className={`dac-qr-panel${card.valid ? "" : " dac-qr-inactive"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/kartu/verifikasi/${encodeURIComponent(token)}/qr`}
                alt={`Kode QR verifikasi Digital Accessibility Card ${card.cardNumber}`}
                width={144}
                height={144}
              />
              <span className="small muted">
                {card.valid ? "Pindai untuk verifikasi" : "QR tidak aktif"}
              </span>
            </div>
          </div>

          <footer className="dac-card-footer">
            <Lock size={16} aria-hidden="true" />
            <p>
              Demi privasi, dokumen pendukung verifikasi dan catatan medis pemilik tidak ditampilkan pada halaman ini. Kartu ini bukan kartu identitas resmi pemerintah.
            </p>
          </footer>
        </article>

        <div className="verify-card-actions">
          <Link className="button secondary" href="/beranda">
            <ArrowLeft size={16} aria-hidden="true" />
            Kembali ke beranda AksesIn
          </Link>
        </div>
      </main>
    </Site>
  );
}

export default function PublicCardVerifyPage({ params }: PageProps<"/kartu/verifikasi/[token]">) {
  return (
    <Suspense fallback={<p className="loading" role="status">Memeriksa keabsahan kartu…</p>}>
      <VerificationContent params={params} />
    </Suspense>
  );
}
