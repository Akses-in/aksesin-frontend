import Link from "next/link";
import {
  cardStatusMap,
  formatDateId,
  type CardNotificationRow,
} from "@/lib/digital-card";
import { RetryButton } from "../_components/retry-button";
import { Icon } from "../_components/site";
import {
  markAllCardNotificationsRead,
  markCardNotificationRead,
} from "./actions";

export function NotificationList({
  notifications,
  hasError,
}: {
  notifications: CardNotificationRow[];
  hasError?: boolean;
}) {
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  if (hasError) {
    return (
      <section className="status-card" aria-labelledby="notifikasi-heading">
        <div className="status-heading">
          <div>
            <p className="small muted">PEMBERITAHUAN STATUS</p>
            <h2 id="notifikasi-heading">Notifikasi pengajuan kartu</h2>
          </div>
          <span className="badge danger">Gagal dimuat</span>
        </div>
        <p className="error" role="alert">
          Daftar notifikasi belum dapat dimuat saat ini. Periksa koneksi internetmu lalu coba muat ulang.
        </p>
        <RetryButton />
      </section>
    );
  }

  return (
    <section className="status-card" aria-labelledby="notifikasi-heading">
      <div className="status-heading">
        <div>
          <p className="small muted">PEMBERITAHUAN STATUS</p>
          <h2 id="notifikasi-heading">Notifikasi pengajuan kartu</h2>
        </div>
        <span className={unreadCount > 0 ? "badge active" : "badge"} role="status">
          {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua terbaca"}
        </span>
      </div>

      {unreadCount > 0 && (
        <form action={markAllCardNotificationsRead}>
          <button type="submit" className="text-button">
            Tandai semua sudah dibaca
          </button>
        </form>
      )}

      {notifications.length === 0 ? (
        <div className="notice icon-line" role="status">
          <Icon name="preferences-info" size={20} />
          <div>
            <p>
              <strong>Belum ada notifikasi status kartu.</strong>
            </p>
            <p className="small muted">
              Setiap kali status pengajuan Digital Accessibility Card kamu berubah (mulai dari menunggu peninjauan, sedang diproses, butuh perbaikan, hingga disetujui), pemberitahuannya akan muncul di sini.
            </p>
          </div>
        </div>
      ) : (
        <ol className="notification-list" aria-label="Riwayat notifikasi status kartu">
          {notifications.map((notif) => {
            const meta = cardStatusMap[notif.status] ?? cardStatusMap.pending;
            return (
              <li
                key={notif.id}
                className={
                  notif.is_read ? "notification-item" : "notification-item unread"
                }
              >
                <div className="status-heading">
                  <strong className="icon-line">
                    <Icon
                      name={
                        notif.status === "verified"
                          ? "summary-circle-check"
                          : "preferences-info"
                      }
                      size={18}
                    />
                    {notif.title}
                  </strong>
                  <span className={meta.badgeClass}>{meta.label}</span>
                </div>
                <p>{notif.message}</p>
                <div className="notification-footer">
                  <span className="small muted">
                    {formatDateId(notif.created_at)}
                  </span>
                  <div className="notification-actions">
                    <Link
                      className="inline-link icon-line"
                      href={notif.deep_link || `/kartu-aksesibilitas#pengajuan-${notif.card_id}`}
                    >
                      Lihat detail kartu
                      <Icon name="summary-arrow-up-right" size={15} />
                    </Link>
                    {!notif.is_read && (
                      <form action={markCardNotificationRead}>
                        <input
                          type="hidden"
                          name="notification_id"
                          value={notif.id}
                        />
                        <button type="submit" className="text-button">
                          Tandai dibaca
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

