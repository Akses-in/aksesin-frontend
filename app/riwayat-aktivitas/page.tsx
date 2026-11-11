import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { accountName, verifiedAccount } from "@/lib/supabase";
import { RetryButton } from "../_components/retry-button";
import { Icon, Site } from "../_components/site";
import type { PlaceOption } from "../akun/place-actions";
import { ActivityFeed, type ActivityItem, type SavedPlaceItem } from "./activity-feed";

export const metadata: Metadata = { title: "Riwayat aktivitas" };

function missingTable(code?: string) {
  return code === "PGRST205" || code === "42P01";
}

async function UserActivities() {
  const { supabase, user } = await verifiedAccount();

  const [
    { data: commentRows, error: commentError },
    { data: contributionRows, error: contributionError },
    { data: savedRows, error: savedError },
  ] = await Promise.all([
    supabase
      .from("community_comments")
      .select("id, post_id, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("accessibility_contributions")
      .select("id, place_id, notes, status, submitted_at")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(30),
    supabase
      .from("saved_places")
      .select("id, place_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const loadFailed = Boolean(
    (commentError && !missingTable(commentError.code)) ||
    (contributionError && !missingTable(contributionError.code)) ||
    (savedError && !missingTable(savedError.code)),
  );

  let activities: ActivityItem[] = [];
  let savedPlaces: SavedPlaceItem[] = [];

  if (!loadFailed) {
    // 1. Resolve comments & post titles
    const rawComments = (commentRows ?? []) as Array<{
      id: string;
      post_id: string;
      content: string;
      created_at: string;
    }>;
    let postMap = new Map<string, string>();
    if (rawComments.length) {
      const postIds = Array.from(new Set(rawComments.map((c) => c.post_id).filter(Boolean)));
      const { data: postRows } = await supabase.from("community_posts").select("id, title").in("id", postIds);
      postMap = new Map<string, string>(((postRows ?? []) as Array<{ id: string; title: string }>).map((p) => [p.id, p.title]));
    }

    const commentItems: ActivityItem[] = rawComments.map((c) => ({
      id: c.id,
      type: "comment",
      title: `Komentar di "${postMap.get(c.post_id) ?? "Diskusi Komunitas"}"`,
      subtitle: "Diskusi Komunitas Aksesin",
      message: c.content,
      badge: "Komentar",
      badgeClass: "badge",
      created_at: c.created_at,
    }));

    // 2. Resolve contributions & place names
    const rawContributions = (contributionRows ?? []) as Array<{
      id: string;
      place_id: string;
      notes: string;
      status: string;
      submitted_at: string;
    }>;
    let placeMap = new Map<string, { name: string; address: string; category: string }>();
    if (rawContributions.length) {
      const placeIds = Array.from(new Set(rawContributions.map((c) => c.place_id).filter(Boolean)));
      const { data: placeRows } = await supabase.from("places").select("id, name, address, category").in("id", placeIds);
      placeMap = new Map(
        ((placeRows ?? []) as Array<{ id: string; name: string; address: string; category: string }>).map((p) => [
          p.id,
          { name: p.name, address: p.address, category: p.category },
        ]),
      );
    }

    const contributionItems: ActivityItem[] = rawContributions.map((c) => {
      const place = placeMap.get(c.place_id);
      const isApproved = c.status === "approved";
      const isRejected = c.status === "rejected";
      return {
        id: c.id,
        type: "contribution",
        title: `Review fasilitas di ${place?.name ?? "Lokasi Fasilitas Publik"}`,
        subtitle: place?.address ? `${place.category} · ${place.address}` : place?.category ?? "Fasilitas Umum",
        message: c.notes,
        badge: isApproved ? "Disetujui" : isRejected ? "Belum disetujui" : "Menunggu peninjauan",
        badgeClass: isApproved ? "badge active" : isRejected ? "badge danger" : "badge warning",
        created_at: c.submitted_at,
      };
    });

    // Merge and sort chronological descending
    activities = [...commentItems, ...contributionItems].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // 3. Resolve saved places
    const savedLinks = (savedRows ?? []) as Array<{ id: string; place_id: string; created_at?: string }>;
    if (savedLinks.length) {
      const { data: savedPlaceRows, error: savedPlacesError } = await supabase
        .from("places")
        .select("id, name, category, address")
        .in("id", savedLinks.map((row) => row.place_id));

      if (!savedPlacesError || missingTable(savedPlacesError.code)) {
        const byId = new Map<string, PlaceOption>(
          ((savedPlaceRows ?? []) as PlaceOption[]).map((place) => [place.id, place]),
        );
        savedPlaces = savedLinks.flatMap((row) => {
          const place = byId.get(row.place_id);
          return place
            ? [
                {
                  savedId: row.id,
                  id: place.id,
                  name: place.name,
                  category: place.category,
                  address: place.address,
                  created_at: row.created_at,
                },
              ]
            : [];
        });
      }
    }
  }

  return (
    <Site name={accountName(user) || "Akun"} variant="summary" activePage="activities">
      <main id="konten" className="site-width account-main" tabIndex={-1}>
        <aside className="account-sidebar">
          <p className="eyebrow muted">Navigasi</p>
          <nav aria-label="Menu pengguna">
            <Link className="icon-line" href="/akun">
              <Icon name="summary-user-round" size={20} />
              Profil saya
            </Link>
            <Link className="icon-line current" aria-current="page" href="/riwayat-aktivitas">
              <Icon name="preferences-circle-check" size={20} />
              Riwayat aktivitas
            </Link>
            <Link className="icon-line" href="/lokasi-tersimpan">
              <Icon name="summary-sliders-horizontal" size={20} />
              Lokasi tersimpan
            </Link>
            <Link className="icon-line" href="/kartu-aksesibilitas">
              <Icon name="register-shield-check" size={20} />
              Kartu aksesibilitas
            </Link>
          </nav>
        </aside>

        <div className="page-stack">
          <div className="page-heading">
            <h1 className="profile-title">Riwayat Aktivitas & Kontribusi</h1>
            <p className="profile-meta">
              <span>Pantau seluruh riwayat aktivitas, komentar, review, dan lokasi yang telah Anda simpan.</span>
            </p>
          </div>

          {loadFailed ? (
            <div className="panel page-stack">
              <p className="error" role="alert">
                Riwayat aktivitas belum dapat dimuat saat ini. Coba muat ulang halaman.
              </p>
              <RetryButton />
            </div>
          ) : (
            <ActivityFeed items={activities} savedPlaces={savedPlaces} />
          )}
        </div>
      </main>
    </Site>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<p className="loading" role="status">Memuat riwayat aktivitas…</p>}>
      <UserActivities />
    </Suspense>
  );
}
