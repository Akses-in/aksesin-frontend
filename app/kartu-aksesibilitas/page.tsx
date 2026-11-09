import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  type BackendCardApplication,
  type BackendCardNotification,
  canCancelCardStatus,
  canEditCardStatus,
  cardBackendRequest,
  cardStatusMap,
  disabilityCategoryOptions,
  documentTypeOptions,
  formatDateId,
  formatFileSize,
  mapBackendCardToRow,
  mapBackendNotificationToRow,
  type CardEvidenceRow,
  type CardNotificationRow,
  type DigitalCardRow,
} from "@/lib/digital-card";
import { accessibilityOptions } from "@/lib/preferences";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { RetryButton } from "../_components/retry-button";
import { Icon, Site } from "../_components/site";
import {
  CancelCardApplicationForm,
  CardApplicationForm,
} from "./card-application-form";
import { NotificationList } from "./notification-list";

export const metadata: Metadata = {
  title: "Digital Accessibility Card & Notifikasi",
};

const activeStatuses = new Set(["pending", "diproses", "perbaikan", "verified"]);

type CardSearchParams = Promise<{ tersimpan?: string | string[] }>;

async function CardApplicationContent({
  params,
}: {
  params: CardSearchParams;
}) {
  const { supabase, user } = await verifiedAccount();
  const { tersimpan } = await params;
  const name = accountName(user);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let cards: DigitalCardRow[] = [];
  let notifications: CardNotificationRow[] = [];
  let activeEvidence: CardEvidenceRow[] = [];
  let cardsLoadFailed = false;
  let notificationsLoadFailed = false;

  let loadedFromBackend = false;
  if (session?.access_token) {
    const [cardsResp, notifResp] = await Promise.all([
      cardBackendRequest("/api/card-applications", session.access_token),
      cardBackendRequest("/api/notifications", session.access_token),
    ]);

    if (cardsResp?.ok && notifResp?.ok) {
      const cardsJson = (await cardsResp.json()) as {
        data?: BackendCardApplication[];
      };
      const notifJson = (await notifResp.json()) as {
        data?: { items?: BackendCardNotification[] };
      };
      const mappedCards = (cardsJson.data ?? []).map(mapBackendCardToRow);
      cards = mappedCards.map((item) => item.card);
      activeEvidence = mappedCards[0]?.evidence ?? [];
      notifications = (notifJson.data?.items ?? []).map(
        mapBackendNotificationToRow,
      );
      loadedFromBackend = true;
    }
  }

  if (!loadedFromBackend) {
    const [cardsResult, notificationsResult] = await Promise.all([
      supabase
        .from("digital_cards")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("card_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const isMissingTableError = (code?: string) =>
      code === "PGRST205" || code === "42P01";

    if (cardsResult.error && !isMissingTableError(cardsResult.error.code)) {
      cardsLoadFailed = true;
    } else {
      cards = (cardsResult.data as DigitalCardRow[] | null) ?? [];
    }

    if (
      notificationsResult.error &&
      !isMissingTableError(notificationsResult.error.code)
    ) {
      notificationsLoadFailed = true;
    } else {
      notifications =
        (notificationsResult.data as CardNotificationRow[] | null) ?? [];
    }

    const firstCard = cards[0];
    if (firstCard) {
      const { data: evidenceData } = await supabase
        .from("card_evidence")
        .select("*")
        .eq("card_id", firstCard.id)
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false });
      activeEvidence = (evidenceData as CardEvidenceRow[] | null) ?? [];
    }
  }

  const latestCard = cards[0] ?? null;
  const activeCard =
    cards.find((item) => activeStatuses.has(item.status)) ?? null;
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <Site name={name || "Akun"} variant="summary">
      <main id="konten" className="site-width account-main" tabIndex={-1}>
        <aside className="account-sidebar">
          <p className="eyebrow muted">Pengaturan</p>
          <nav aria-label="Pengaturan akun">
            <Link className="icon-line" href="/akun">
              <Icon name="summary-user-round" size={20} />
              Akun &amp; preferensi
            </Link>
            <Link
              className="icon-line current"
              aria-current="page"
              href="/kartu-aksesibilitas"
            >
              <Icon name="register-shield-check" size={20} />
              <span>Kartu aksesibilitas</span>
              {unreadCount > 0 && (
                <span className="badge active" aria-label={`${unreadCount} notifikasi belum dibaca`}>
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link className="icon-line" href="/bantuan">
              <Icon name="summary-circle-help" size={20} />
              Bantuan
            </Link>
          </nav>
          <div className="sidebar-note small muted">
            <Icon name="summary-lock-keyhole" size={18} />
            <p>
              Dokumen pendukung bersifat rahasia dan hanya diakses untuk proses verifikasi kartu.
            </p>
          </div>
        </aside>

        <div className="page-stack">
          <div className="page-heading">
            <div className="status-heading">
              <p className="eyebrow">OPSIONAL · PROFIL AKSESIBILITAS</p>
              <p className="icon-line small muted">
                <Icon name="summary-lock-keyhole" size={15} />
                Data milikmu sendiri
              </p>
            </div>
            <h1>Digital Accessibility Card</h1>
            <p>
              Ajukan, pantau status verifikasi, perbarui dokumen pendukung, atau batalkan pengajuan kartu aksesibilitas digitalmu kapan saja sebelum verifikasi selesai.
            </p>
          </div>

          {tersimpan === "baru" && (
            <p className="notice icon-line" role="status">
              <Icon name="summary-circle-check" size={20} />
              Pengajuan Digital Accessibility Card berhasil dikirim dan sedang menunggu peninjauan.
            </p>
          )}
          {tersimpan === "perbarui" && (
            <p className="notice icon-line" role="status">
              <Icon name="summary-circle-check" size={20} />
              Data dan dokumen pengajuan kartu berhasil diperbarui.
            </p>
          )}
          {tersimpan === "batal" && (
            <p className="notice icon-line" role="status">
              <Icon name="summary-circle-check" size={20} />
              Pengajuan kartu telah dibatalkan dan dokumen pendukungmu telah ditarik.
            </p>
          )}

          {cardsLoadFailed ? (
            <section className="status-card">
              <h2>Data pengajuan belum dapat dimuat</h2>
              <p className="error" role="alert">
                Status pengajuan kartu belum dapat dibaca saat ini. Silakan muat ulang halaman.
              </p>
              <RetryButton />
            </section>
          ) : (
            <>
              {latestCard && (
                <CardDetailSection
                  card={latestCard}
                  evidence={activeEvidence}
                />
              )}

              {!activeCard && (
                <section className="panel page-stack" aria-labelledby="form-pengajuan-heading">
                  <div className="section-intro">
                    <p className="eyebrow">FORMULIR PENGAJUAN BARU</p>
                    <h2 id="form-pengajuan-heading">
                      {latestCard
                        ? "Ajukan kembali Digital Accessibility Card"
                        : "Buat pengajuan Digital Accessibility Card"}
                    </h2>
                    <p className="muted">
                      Pengajuan ini bersifat opsional. Kamu tetap dapat menjelajahi peta dan berkontribusi di Aksesin tanpa kartu ini.
                    </p>
                  </div>
                  <CardApplicationForm defaultName={name} />
                </section>
              )}
            </>
          )}

          <NotificationList
            notifications={notifications}
            hasError={notificationsLoadFailed}
          />
        </div>
      </main>
    </Site>
  );
}

function CardDetailSection({
  card,
  evidence,
}: {
  card: DigitalCardRow;
  evidence: CardEvidenceRow[];
}) {
  const statusMeta = cardStatusMap[card.status] ?? cardStatusMap.pending;
  const categoryLabel =
    disabilityCategoryOptions.find(([val]) => val === card.disability_category)?.[1] ??
    card.disability_category;
  const selectedNeeds = accessibilityOptions.filter(([val]) =>
    card.needs?.includes(val),
  );
  const editable = canEditCardStatus(card.status);
  const cancellable = canCancelCardStatus(card.status);

  return (
    <section
      id={`pengajuan-${card.id}`}
      className="status-card"
      aria-labelledby="detail-kartu-heading"
    >
      <div className="status-heading">
        <div>
          <p className="small muted">STATUS PENGAJUAN KARTU</p>
          <h2 id="detail-kartu-heading">Detail &amp; status verifikasi</h2>
        </div>
        <span className={statusMeta.badgeClass} role="status">
          {statusMeta.label}
        </span>
      </div>

      <p className="muted">{statusMeta.description}</p>

      {card.reviewer_note && (
        <div
          className={card.status === "verified" ? "notice" : "error"}
          role={card.status === "verified" ? "status" : "alert"}
        >
          <strong>Catatan tim verifikasi:</strong> {card.reviewer_note}
        </div>
      )}

      <dl className="account-details">
        <div>
          <dt>Nama pada kartu</dt>
          <dd>{card.full_name}</dd>
        </div>
        <div>
          <dt>Kategori disabilitas</dt>
          <dd>{categoryLabel}</dd>
        </div>
        <div>
          <dt>Waktu pengajuan</dt>
          <dd>{formatDateId(card.submitted_at)}</dd>
        </div>
        <div>
          <dt>Pembaruan terakhir</dt>
          <dd>{formatDateId(card.updated_at)}</dd>
        </div>
      </dl>

      {selectedNeeds.length > 0 && (
        <dl className="preference-details">
          <div>
            <dt>Kebutuhan fasilitas pada kartu</dt>
            <dd className="badges">
              {selectedNeeds.map(([val, label]) => (
                <span className="badge active" key={val}>
                  {label}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      )}

      {card.notes && (
        <dl className="preference-details">
          <div>
            <dt>Catatan tambahan</dt>
            <dd className="saved-notes">{card.notes}</dd>
          </div>
        </dl>
      )}

      <dl className="preference-details">
        <div>
          <dt>Dokumen pendukung terlampir</dt>
          <dd>
            {evidence.length > 0 ? (
              <ul>
                {evidence.map((file) => (
                  <li key={file.id}>
                    {file.file_name} ({documentTypeOptions.find(([value]) => value === file.document_type)?.[1]} ·{" "}
                    {formatFileSize(file.file_size)}){" "}
                    <a
                      className="inline-link"
                      href={`/kartu-aksesibilitas/dokumen/${card.id}/${file.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Lihat pratinjau ${file.file_name} (tab baru)`}
                    >
                      Lihat pratinjau
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="muted">Tidak ada dokumen aktif (telah ditarik/dihapus)</span>
            )}
          </dd>
        </div>
      </dl>

      {(editable || cancellable) && (
        <div className="status-footnote page-stack">
          {editable ? (
            <details className="card-edit-disclosure" open={card.status === "perbaikan"}>
              <summary className="button secondary">
                {card.status === "perbaikan"
                  ? "Perbaiki data & unggah ulang dokumen"
                  : "Perbarui data atau dokumen pengajuan"}
              </summary>
              <div className="card-edit-body">
                <CardApplicationForm
                  defaultName={card.full_name}
                  existingCard={card}
                  existingEvidence={evidence}
                />
              </div>
            </details>
          ) : (
            <p className="small muted">
              Data tidak dapat diedit karena pengajuan sedang diperiksa oleh tim verifikasi, tetapi kamu masih dapat membatalkan pengajuan jika diperlukan.
            </p>
          )}

          {cancellable && (
            <div className="cancel-action-area">
              <p className="small muted">
                Ingin menghentikan proses verifikasi? Membatalkan pengajuan akan menarik dokumen pendukung yang sudah diunggah.
              </p>
              <CancelCardApplicationForm cardId={card.id} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function DigitalCardPage({
  searchParams,
}: {
  searchParams: CardSearchParams;
}) {
  return (
    <Suspense
      fallback={
        <p className="loading" role="status">
          Memuat halaman Digital Accessibility Card…
        </p>
      }
    >
      <CardApplicationContent params={searchParams} />
    </Suspense>
  );
}
