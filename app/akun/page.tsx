import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { preferencesFields, type Preferences } from "@/lib/preferences";
import {
  cardStatusMap,
  formatDateId,
  type CardNotificationRow,
  type DigitalCardRow,
} from "@/lib/digital-card";
import {
  accountIdentity,
  disabilityLabel,
  hasAccessibilityProfile,
  needLabels,
  onboardingStatus,
} from "@/lib/profile";
import { RetryButton } from "../_components/retry-button";
import { Icon, Site } from "../_components/site";
import type { PlaceOption } from "./place-actions";
import { SavedPlaces, type SavedPlace } from "./saved-places";

export const metadata: Metadata = { title: "Profil dan kebutuhan aksesibilitas" };

function missingTable(code?: string) {
  return code === "PGRST205" || code === "42P01";
}

type ActivityEntry = {
  id: string;
  type: "comment" | "contribution" | "notification";
  badge?: string;
  badgeClass?: string;
  title: string;
  subtitle?: string;
  message: string;
  created_at: string;
};

async function Profile({ params }: { params: PageProps<"/akun">["searchParams"] }) {
  const { supabase, user } = await verifiedAccount();
  const [
    { data, error },
    { data: cardRows, error: cardError },
    { data: activityRows, error: activityError },
    { data: commentRows, error: commentError },
    { data: contributionRows, error: contributionError },
  ] = await Promise.all([
    supabase.from("accessibility_preferences")
      .select(preferencesFields).eq("user_id", user.id).maybeSingle<Preferences>(),
    supabase.from("digital_cards")
      .select("id, status, updated_at").eq("user_id", user.id)
      .order("updated_at", { ascending: false }).limit(1),
    supabase.from("card_notifications")
      .select("id, title, message, created_at").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(4),
    supabase.from("community_comments")
      .select("id, post_id, content, created_at").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(10),
    supabase.from("accessibility_contributions")
      .select("id, place_id, notes, status, submitted_at").eq("user_id", user.id)
      .order("submitted_at", { ascending: false }).limit(10),
  ]);
  const { keluar, tersimpan } = await params;
  const name = accountName(user);
  const identity = accountIdentity(user);
  const status = disabilityLabel(data?.disability_status ?? null);
  const needs = needLabels(data?.needs ?? []);
  const filled = hasAccessibilityProfile(data);
  const latestCard = ((cardRows ?? [])[0] ?? null) as Pick<DigitalCardRow, "id" | "status" | "updated_at"> | null;

  let commentActivities: ActivityEntry[] = [];
  const rawComments = (commentRows ?? []) as Array<{ id: string; post_id: string; content: string; created_at: string }>;
  if (rawComments.length) {
    const postIds = Array.from(new Set(rawComments.map((c) => c.post_id).filter(Boolean)));
    const { data: postRows } = await supabase.from("community_posts").select("id, title").in("id", postIds);
    const postMap = new Map<string, string>(((postRows ?? []) as Array<{ id: string; title: string }>).map((p) => [p.id, p.title]));
    commentActivities = rawComments.map((c) => ({
      id: c.id,
      type: "comment",
      badge: "Komentar",
      title: `Komentar di "${postMap.get(c.post_id) ?? "Postingan Komunitas"}"`,
      message: c.content,
      created_at: c.created_at,
    }));
  }

  let contributionActivities: ActivityEntry[] = [];
  const rawContributions = (contributionRows ?? []) as Array<{
    id: string;
    place_id: string;
    notes: string;
    status: string;
    submitted_at: string;
  }>;
  if (rawContributions.length) {
    const placeIds = Array.from(new Set(rawContributions.map((c) => c.place_id).filter(Boolean)));
    const { data: placeRows } = await supabase.from("places").select("id, name, address, category").in("id", placeIds);
    const placeMap = new Map<string, { name: string; address?: string; category?: string }>(
      ((placeRows ?? []) as Array<{ id: string; name: string; address?: string; category?: string }>).map((p) => [
        p.id,
        { name: p.name, address: p.address, category: p.category },
      ]),
    );
    contributionActivities = rawContributions.map((c) => {
      const isApproved = c.status === "approved";
      const isRejected = c.status === "rejected";
      const place = placeMap.get(c.place_id);
      return {
        id: c.id,
        type: "contribution",
        badge: isApproved ? "Disetujui" : isRejected ? "Belum disetujui" : "Menunggu peninjauan",
        badgeClass: isApproved ? "badge active" : isRejected ? "badge danger" : "badge warning",
        title: `Review fasilitas di ${place?.name ?? "Lokasi Publik"}`,
        subtitle: place?.address ? `${place.category ?? "Fasilitas"} · ${place.address}` : undefined,
        message: c.notes,
        created_at: c.submitted_at,
      };
    });
  }

  const notificationActivities: ActivityEntry[] = (
    (activityRows ?? []) as Array<Pick<CardNotificationRow, "id" | "title" | "message" | "created_at">>
  ).map((n) => ({
    id: n.id,
    type: "notification",
    title: n.title,
    message: n.message,
    created_at: n.created_at,
  }));

  const activities: ActivityEntry[] = [
    ...commentActivities,
    ...contributionActivities,
    ...notificationActivities,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const cardLoadFailed = Boolean(cardError && !missingTable(cardError.code));
  const activityLoadFailed = Boolean(
    (activityError && !missingTable(activityError.code)) ||
    (commentError && !missingTable(commentError.code)) ||
    (contributionError && !missingTable(contributionError.code))
  );
  const cardStatus = latestCard ? cardStatusMap[latestCard.status] : null;

  const { data: savedRows, error: savedError } = await supabase
    .from("saved_places").select("id, place_id").eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const savedLinks = (savedRows ?? []) as Array<{ id: string; place_id: string }>;
  let savedLoadFailed = Boolean(savedError && !missingTable(savedError.code));
  let savedPlaces: SavedPlace[] = [];

  if (!savedLoadFailed && savedLinks.length) {
    const { data: placeRows, error: placesError } = await supabase.from("places")
      .select("id, name, category, address").in("id", savedLinks.map((row) => row.place_id));
    if (placesError && !missingTable(placesError.code)) {
      savedLoadFailed = true;
    } else {
      const byId = new Map<string, PlaceOption>(
        ((placeRows ?? []) as PlaceOption[]).map((place) => [place.id, place]),
      );
      savedPlaces = savedLinks.flatMap((row) => {
        const place = byId.get(row.place_id);
        return place ? [{ savedId: row.id, ...place }] : [];
      });
    }
  }

  return (
    <Site name={name || "Akun"} variant="summary">
      <main id="konten" className="site-width account-main" tabIndex={-1}>
        <aside className="account-sidebar">
          <p className="eyebrow muted">Pengaturan</p>
          <nav aria-label="Pengaturan akun">
            <Link className="icon-line current" aria-current="page" href="/akun"><Icon name="summary-user-round" size={20} />Profil saya</Link>
            <Link className="icon-line" href="/riwayat-aktivitas"><Icon name="preferences-circle-check" size={20} />Riwayat aktivitas</Link>
            <Link className="icon-line" href="/kartu-aksesibilitas"><Icon name="register-shield-check" size={20} />Kartu aksesibilitas</Link>
            <Link className="icon-line" href="/bantuan"><Icon name="summary-circle-help" size={20} />Bantuan</Link>
          </nav>
          <Link className="sidebar-privacy" href="/privasi">
            <Icon name="summary-lock-keyhole" size={18} />
            Kebijakan privasi
          </Link>
        </aside>

        <div className="page-stack">
          <div className="page-heading">
            <h1 className="profile-title">{name || "Profil saya"}</h1>
            <p className="profile-meta">
              <span>{identity.label} {identity.value}</span>
              <span className="profile-verified"><Icon name="summary-circle-check" size={16} />Terverifikasi</span>
            </p>
          </div>

          {(tersimpan === "nama" || tersimpan === "nomor" || tersimpan === "preferensi") && (
            <p className="notice icon-line" role="status">
              <Icon name="summary-circle-check" size={20} />
              {tersimpan === "nama" && "Nama sudah diperbarui."}
              {tersimpan === "nomor" && "Nomor WhatsApp sudah diperbarui."}
              {tersimpan === "preferensi" && "Kebutuhan aksesibilitas sudah diperbarui."}
            </p>
          )}
          {keluar === "gagal" && <p className="error" role="alert">Sesi belum dapat diakhiri. Coba keluar lagi.</p>}

          <section className="panel profile-sheet">
            <div className="profile-block">
              <div className="profile-block-head">
                <h2 className="profile-block-title"><Icon name="summary-user-round" size={20} />Data akun</h2>
                <Link className="profile-action" href="/akun/edit" aria-label="Ubah data akun">Ubah</Link>
              </div>
              <dl className="profile-facts">
                <div className="profile-fact"><dt>Nama lengkap</dt><dd>{name || "Belum tersedia"}</dd></div>
                <div className="profile-fact"><dt>{identity.label}</dt><dd>{identity.value || "Belum tersedia"}</dd></div>
                <div className="profile-fact"><dt>Status onboarding</dt><dd>{error ? "Belum dapat dimuat" : onboardingStatus(data)}</dd></div>
              </dl>
            </div>

            <div className="profile-block">
              <div className="profile-block-head">
                <h2 className="profile-block-title"><Icon name="summary-sliders-horizontal" size={20} />Kebutuhan aksesibilitas</h2>
                <Link className="profile-action" href="/akun/edit"
                  aria-label={filled ? "Ubah kebutuhan aksesibilitas" : "Isi kebutuhan aksesibilitas"}>
                  {filled ? "Ubah" : "Isi"}
                </Link>
              </div>

              {error ? (
                <div className="page-stack">
                  <p className="error" role="alert">Data opsional belum dapat dimuat. Akunmu tetap bisa dipakai.</p>
                  <RetryButton />
                </div>
              ) : filled ? (
                <>
                  <dl className="profile-facts stacked">
                    {status && <div className="profile-fact"><dt>Status disabilitas</dt><dd>{status}</dd></div>}
                    {!!needs.length && (
                      <div className="profile-fact">
                        <dt>Kebutuhan</dt>
                        <dd>
                          <ul className="profile-tags">
                            {needs.map((label) => <li className="profile-tag" key={label}>{label}</li>)}
                          </ul>
                        </dd>
                      </div>
                    )}
                    {data?.notes && <div className="profile-fact wide"><dt>Catatan</dt><dd className="saved-notes">{data.notes}</dd></div>}
                  </dl>
                  <p className="profile-note"><Icon name="summary-lock-keyhole" size={16} />
                    Hanya kamu yang bisa melihat isian ini. Data tidak tampil di profil publik.</p>
                </>
              ) : (
                <p className="muted">
                  {data?.onboarding_skipped
                    ? "Kamu melewati bagian ini saat onboarding. Isi kapan saja kalau berubah pikiran."
                    : "Belum diisi. Bagian ini opsional dan tidak memengaruhi akses ke fitur publik."}
                </p>
              )}
            </div>
          </section>

          {/* Rangkuman Aktivitas & Lokasi Tersimpan (Subtask 2) */}
          <section className="activity-summary-grid" aria-label="Rangkuman aktivitas">
            <div className="activity-stat-card">
              <span className="activity-stat-val">{activities.length}</span>
              <span className="activity-stat-label">Aktivitas Saya</span>
            </div>
            <div className="activity-stat-card">
              <span className="activity-stat-val">{commentActivities.length}</span>
              <span className="activity-stat-label">Komentar Postingan</span>
            </div>
            <div className="activity-stat-card">
              <span className="activity-stat-val">{contributionActivities.length}</span>
              <span className="activity-stat-label">Review Lokasi</span>
            </div>
            <div className="activity-stat-card">
              <span className="activity-stat-val">{savedPlaces.length}</span>
              <span className="activity-stat-label">Lokasi Tersimpan</span>
            </div>
          </section>

          <section className="panel profile-sheet">
            <div className="profile-block">
              <div className="profile-block-head">
                <h2 className="profile-block-title"><Icon name="register-shield-check" size={20} />Kartu aksesibilitas</h2>
                <Link className="profile-action" href="/kartu-aksesibilitas" aria-label="Buka halaman kartu aksesibilitas">Buka</Link>
              </div>
              {cardLoadFailed ? (
                <p className="error" role="alert">Status kartu belum dapat dimuat. Buka halaman kartu untuk melihat detail.</p>
              ) : latestCard && cardStatus ? (
                <>
                  <dl className="profile-facts">
                    <div className="profile-fact"><dt>Status</dt><dd>{cardStatus.label}</dd></div>
                    <div className="profile-fact"><dt>Pembaruan terakhir</dt><dd>{formatDateId(latestCard.updated_at)}</dd></div>
                  </dl>
                  <p className="muted">{cardStatus.description}</p>
                </>
              ) : (
                <p className="muted">Belum ada pengajuan kartu. Kartu aksesibilitas membantumu menunjukkan kebutuhan aksesibilitas saat berkunjung.</p>
              )}
            </div>

            <div className="profile-block">
              <div className="profile-block-head">
                <h2 className="profile-block-title"><Icon name="preferences-circle-check" size={20} />Aktivitas terakhir</h2>
                <Link className="profile-action" href="/riwayat-aktivitas" aria-label="Lihat semua riwayat aktivitas">Lihat semua</Link>
              </div>
              {activityLoadFailed ? (
                <p className="error" role="alert">Aktivitas belum dapat dimuat. Coba muat ulang halaman.</p>
              ) : activities.length ? (
                <ol className="activity-list" aria-label="Riwayat aktivitas saya">
                  {activities.map((item) => (
                    <li className="activity-item" key={item.id}>
                      <div className="status-heading">
                        <p className="activity-time">{formatDateId(item.created_at)}</p>
                        {item.badge && (
                          <span className={item.badgeClass ?? "badge"}>{item.badge}</span>
                        )}
                      </div>
                      <p className="activity-title">{item.title}</p>
                      {item.subtitle && <p className="place-meta">{item.subtitle}</p>}
                      <p className="activity-message">{item.message}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">Belum ada riwayat aktivitas. Komentar pada postingan komunitas dan kontribusi review lokasi yang kamu kirim akan muncul di sini.</p>
              )}
            </div>
          </section>

          <section className="panel profile-sheet">
            <div className="profile-block">
              <div className="profile-block-head">
                <h2>Lokasi tersimpan</h2>
                <Link className="profile-action" href="/lokasi-tersimpan" aria-label="Buka halaman lokasi tersimpan">Buka peta</Link>
              </div>
              {savedLoadFailed ? (
                <p className="error" role="alert">Lokasi tersimpan belum dapat dimuat. Coba muat ulang halaman.</p>
              ) : (
                <SavedPlaces places={savedPlaces} />
              )}
            </div>
          </section>
        </div>
      </main>
    </Site>
  );
}

export default function AccountPage({ searchParams }: PageProps<"/akun">) {
  return <Suspense fallback={<p className="loading" role="status">Memuat profil…</p>}><Profile params={searchParams} /></Suspense>;
}
