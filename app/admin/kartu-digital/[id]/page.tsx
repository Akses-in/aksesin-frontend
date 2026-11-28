import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatFileSize } from "@/lib/digital-card";
import { isUuid } from "@/lib/place";
import { accessibilityOptions } from "@/lib/preferences";
import { RetryButton } from "../../../_components/retry-button";
import { adminAccessToken, adminApi } from "../../_impor-osm/backend";
import { formatWib } from "../../_impor-osm/labels";
import { CardDecisionPanel, CardLifecyclePanel } from "../../_kartu-digital/card-review-panels";
import {
  actorRoleLabels,
  disabilityLabel,
  documentTypeLabel,
  historyActionLabels,
  issuedCardStateMeta,
  statusBadge,
  type AdminCardDetail,
} from "../../_kartu-digital/labels";
import { adminSections } from "../../sections";
import { AdminWorkspace } from "../../workspace";

const kartuSection = adminSections.find(({ slug }) => slug === "kartu-digital")!;

async function CardDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const token = await adminAccessToken();
  const result = await adminApi<AdminCardDetail>(`/api/admin/card-applications/${id}`, token);

  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <AdminWorkspace section={kartuSection}>
        <section className="status-card">
          <h2>Detail pengajuan belum dapat dimuat</h2>
          <p className="error" role="alert">{result.message}</p>
          <div className="button-row">
            <RetryButton />
            <Link className="osm-text-link" href="/admin/kartu-digital" prefetch={false}>
              Kembali ke antrean kartu
            </Link>
          </div>
        </section>
      </AdminWorkspace>
    );
  }

  const card = result.data;
  const statusMeta = statusBadge(card.status);
  const selectedNeeds = accessibilityOptions.filter(([value]) => card.needs.includes(value));

  return (
    <AdminWorkspace section={kartuSection}>
      <div>
        <Link className="osm-text-link" href="/admin/kartu-digital" prefetch={false}>
          ← Kembali ke antrean pengajuan kartu
        </Link>
      </div>

      <section className="status-card" aria-labelledby="admin-card-detail-title">
        <div className="status-heading">
          <div>
            <p className="small muted">DETAIL PENGAJUAN</p>
            <h2 id="admin-card-detail-title">{card.fullName}</h2>
          </div>
          <span className={statusMeta.badgeClass} role="status">
            {statusMeta.label}
          </span>
        </div>

        <dl className="account-details">
          <div>
            <dt>Kategori disabilitas</dt>
            <dd>{disabilityLabel(card.disabilityCategory)}</dd>
          </div>
          <div>
            <dt>Persetujuan data</dt>
            <dd>{card.consentGiven ? `Disetujui (${formatWib(card.consentAt)})` : "Belum"}</dd>
          </div>
          <div>
            <dt>Waktu pengajuan</dt>
            <dd>{formatWib(card.submittedAt)}</dd>
          </div>
          <div>
            <dt>Pembaruan terakhir</dt>
            <dd>{formatWib(card.updatedAt)}</dd>
          </div>
        </dl>

        {selectedNeeds.length > 0 && (
          <dl className="preference-details">
            <div>
              <dt>Kebutuhan aksesibilitas</dt>
              <dd className="badges">
                {selectedNeeds.map(([val, label]) => (
                  <span key={val} className="badge active">{label}</span>
                ))}
              </dd>
            </div>
          </dl>
        )}

        {card.notes && (
          <dl className="preference-details">
            <div>
              <dt>Catatan pemohon</dt>
              <dd className="saved-notes">{card.notes}</dd>
            </div>
          </dl>
        )}

        {card.reviewerNote && (
          <div className={card.status === "verified" ? "notice" : "error"} role="status">
            <strong>Catatan peninjau terakhir:</strong> {card.reviewerNote}
          </div>
        )}
      </section>

      <section className="status-card" aria-labelledby="admin-card-docs-title">
        <div>
          <p className="small muted">VERIFIKASI BERKAS</p>
          <h2 id="admin-card-docs-title">Dokumen pendukung ({card.documents.length})</h2>
        </div>

        {!card.documents.length ? (
          <p className="muted" role="status">Tidak ada dokumen aktif (sudah ditarik atau dibatalkan).</p>
        ) : (
          <ul className="card-admin-doc-list">
            {card.documents.map((doc) => {
              const docUrl = `/admin/kartu-digital/${card.id}/dokumen/${doc.id}`;
              const isImage = doc.mimeType.startsWith("image/");
              return (
                <li key={doc.id} className="card-admin-doc-item">
                  <div className="status-heading">
                    <div>
                      <strong>{doc.fileName}</strong>
                      <p className="small muted">
                        {documentTypeLabel(doc.documentType)} · {formatFileSize(doc.fileSize)} · Diunggah{" "}
                        {formatWib(doc.uploadedAt)}
                      </p>
                    </div>
                    <a
                      className="button secondary"
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Buka dokumen (tab baru)
                    </a>
                  </div>
                  {isImage && (
                    <div className="card-admin-doc-preview">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={docUrl} alt={`Pratinjau ${doc.fileName}`} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {card.issuedCard && (
        <section className="status-card" aria-labelledby="admin-issued-card-title">
          <div className="status-heading">
            <div>
              <p className="small muted">KARTU DITERBITKAN</p>
              <h2 id="admin-issued-card-title">{card.issuedCard.cardNumber}</h2>
            </div>
            <span className={issuedCardStateMeta[card.issuedCard.state].badgeClass}>
              {issuedCardStateMeta[card.issuedCard.state].label}
            </span>
          </div>

          <div className="card-admin-issued-layout">
            <dl className="account-details">
              <div>
                <dt>Nomor kartu</dt>
                <dd>{card.issuedCard.cardNumber}</dd>
              </div>
              <div>
                <dt>Tanggal terbit</dt>
                <dd>{formatWib(card.issuedCard.issuedAt)}</dd>
              </div>
              <div>
                <dt>Berlaku hingga</dt>
                <dd>{formatWib(card.issuedCard.expiresAt)}</dd>
              </div>
              {card.issuedCard.revokedAt && (
                <div>
                  <dt>Dicabut pada</dt>
                  <dd>{formatWib(card.issuedCard.revokedAt)}</dd>
                </div>
              )}
              <div>
                <dt>Tautan verifikasi QR publik</dt>
                <dd>
                  <Link
                    className="osm-text-link"
                    href={`/kartu/verifikasi/${card.issuedCard.qrToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buka halaman verifikasi QR
                  </Link>
                </dd>
              </div>
            </dl>

            <div className="card-admin-qr-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/admin/kartu-digital/${card.id}/qr`}
                alt={`Kode QR Digital Accessibility Card ${card.issuedCard.cardNumber}`}
                width={180}
                height={180}
              />
              <span className="small muted">QR tidak memuat dokumen atau catatan sensitif</span>
            </div>
          </div>
        </section>
      )}

      <CardDecisionPanel cardId={card.id} status={card.status} applicantName={card.fullName} />

      {card.issuedCard && (
        <CardLifecyclePanel
          cardId={card.id}
          cardNumber={card.issuedCard.cardNumber}
          status={card.status}
        />
      )}

      <section className="status-card" aria-labelledby="admin-card-history-title">
        <div>
          <p className="small muted">AUDIT TRAIL (PBI-20)</p>
          <h2 id="admin-card-history-title">Riwayat peninjauan ({card.history.length})</h2>
        </div>

        {!card.history.length ? (
          <p className="muted" role="status">Belum ada riwayat peninjauan yang tercatat.</p>
        ) : (
          <ol className="card-admin-history-list">
            {card.history.map((entry) => {
              const prevLabel = entry.previousStatus ? statusBadge(entry.previousStatus).label : "Baru";
              const nextLabel = statusBadge(entry.newStatus).label;
              const actorText = entry.actorName
                ? `${entry.actorName} (${actorRoleLabels[entry.actorRole]})`
                : actorRoleLabels[entry.actorRole];
              return (
                <li key={entry.id} className="card-admin-history-item">
                  <div className="status-heading">
                    <strong>{historyActionLabels[entry.action]}</strong>
                    <span className="small muted">{formatWib(entry.createdAt)}</span>
                  </div>
                  <p className="small muted">
                    Peninjau/Aktor: {actorText} · Perubahan status: {prevLabel} → {nextLabel}
                  </p>
                  {entry.reason && <p>{entry.reason}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </AdminWorkspace>
  );
}

export default function AdminCardDetailPage({ params }: PageProps<"/admin/kartu-digital/[id]">) {
  return (
    <Suspense fallback={<p className="loading" role="status">Memuat detail pengajuan kartu…</p>}>
      <CardDetailContent params={params} />
    </Suspense>
  );
}
