"use client";

import { useState } from "react";
import { formatDateId } from "@/lib/digital-card";
import type { SavedPlace } from "@/lib/saved-places";
import { SavedPlaces } from "../lokasi-tersimpan/saved-places";

export type ActivityItem = {
  id: string;
  type: "comment" | "contribution" | "saved";
  title: string;
  subtitle?: string;
  message: string;
  badge: string;
  badgeClass: string;
  created_at: string;
};

export function ActivityFeed({
  items,
  savedPlaces,
}: {
  items: ActivityItem[];
  savedPlaces: SavedPlace[];
}) {
  const [filter, setFilter] = useState<"all" | "comment" | "contribution" | "saved">("all");

  const commentCount = items.filter((i) => i.type === "comment").length;
  const contribCount = items.filter((i) => i.type === "contribution").length;

  const filteredActivities = items.filter((item) => {
    if (filter === "comment") return item.type === "comment";
    if (filter === "contribution") return item.type === "contribution";
    return true;
  });

  return (
    <div className="page-stack">
      {/* Kartu Statistik Interaktif sebagai Tombol Filter */}
      <section className="activity-summary-grid" aria-label="Rangkuman dan filter aktivitas">
        <button
          type="button"
          className={`activity-stat-card ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
        >
          <span className="activity-stat-val">{items.length}</span>
          <span className="activity-stat-label">Total Aktivitas</span>
        </button>

        <button
          type="button"
          className={`activity-stat-card ${filter === "comment" ? "active" : ""}`}
          onClick={() => setFilter("comment")}
          aria-pressed={filter === "comment"}
        >
          <span className="activity-stat-val">{commentCount}</span>
          <span className="activity-stat-label">Komentar Postingan</span>
        </button>

        <button
          type="button"
          className={`activity-stat-card ${filter === "contribution" ? "active" : ""}`}
          onClick={() => setFilter("contribution")}
          aria-pressed={filter === "contribution"}
        >
          <span className="activity-stat-val">{contribCount}</span>
          <span className="activity-stat-label">Review Lokasi</span>
        </button>

        <button
          type="button"
          className={`activity-stat-card ${filter === "saved" ? "active" : ""}`}
          onClick={() => setFilter("saved")}
          aria-pressed={filter === "saved"}
        >
          <span className="activity-stat-val">{savedPlaces.length}</span>
          <span className="activity-stat-label">Simpan Lokasi</span>
        </button>
      </section>

      {/* Konten Riwayat Berdasarkan Filter */}
      <section className="panel profile-sheet">
        <div className="profile-block">
          <div className="profile-block-head">
            <h2 className="profile-block-title">
              {filter === "all" && "Semua Aktivitas Saya"}
              {filter === "comment" && "Komentar Postingan"}
              {filter === "contribution" && "Review Lokasi"}
              {filter === "saved" && "Lokasi tersimpan"}
            </h2>
          </div>

          {filter === "saved" ? (
            <SavedPlaces places={savedPlaces} showSearch={false} />
          ) : (
            /* Tampilan Aktivitas (Semua, Komentar, Review Lokasi) */
            filteredActivities.length === 0 ? (
              <div className="empty-activity-card" role="status">
                <p className="empty-activity-title">
                  {filter === "all" && "Belum ada aktivitas."}
                  {filter === "comment" && "Belum ada komentar."}
                  {filter === "contribution" && "Belum ada review lokasi."}
                </p>
              </div>
            ) : (
              <ol className="activity-list" aria-label="Daftar aktivitas saya">
                {filteredActivities.map((item) => (
                  <li className="activity-item" key={`${item.type}:${item.id}`}>
                    <div className="status-heading">
                      <p className="activity-time">{formatDateId(item.created_at)}</p>
                      <span className={item.badgeClass}>{item.badge}</span>
                    </div>
                    <p className="activity-title">{item.title}</p>
                    {item.subtitle && <p className="place-meta">{item.subtitle}</p>}
                    {item.message && <p className="activity-message">{item.message}</p>}
                  </li>
                ))}
              </ol>
            )
          )}
        </div>
      </section>
    </div>
  );
}

