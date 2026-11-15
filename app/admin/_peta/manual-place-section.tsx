"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PlaceDeleteDialog } from "./place-delete-dialog";
import { PlaceFormModal } from "./place-form-modal";
import "./peta.css";

export interface PlaceItemData {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  accessibilityStatus: string;
  accessibilityAttributes: Record<string, string>;
  dataSource: string;
}

interface ManualPlaceManagementProps {
  stats: {
    total: number;
    accessible: number;
    partial: number;
    unknown: number;
  };
  places: PlaceItemData[];
  totalPlaces: number;
  page: number;
  pageSize: number;
  q: string;
  status: string;
  category: string;
}

const CATEGORY_FILTER_OPTIONS = [
  "Semua Kategori",
  "Pendidikan",
  "Kesehatan",
  "Transportasi",
  "Perbelanjaan",
  "Taman",
  "Layanan Publik",
  "Wisata dan Budaya",
  "Tempat Ibadah",
  "Lainnya",
];

export function ManualPlaceManagement({
  stats,
  places,
  totalPlaces,
  page,
  pageSize,
  q,
  status,
  category,
}: ManualPlaceManagementProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceItemData | null>(null);
  const [deletingPlace, setDeletingPlace] = useState<PlaceItemData | null>(null);

  const [searchInput, setSearchInput] = useState(q);

  function updateQuery(newParams: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(newParams)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`/admin/peta?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateQuery({ q: searchInput.trim() || null, page: "1" });
  }

  const totalPages = Math.max(1, Math.ceil(totalPlaces / pageSize));
  const startItem = totalPlaces === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalPlaces);

  return (
    <>
      <div className="peta-top-actions">
        <Link href="/beranda" className="peta-maps-link">
          ↗ Lihat Maps
        </Link>
        <button
          type="button"
          className="peta-btn-add"
          onClick={() => setIsAddOpen(true)}
        >
          + Tambah Tempat
        </button>
      </div>

      {/* Ringkasan Lokasi */}
      <section className="peta-stats-card" aria-labelledby="ringkasan-title">
        <h2 id="ringkasan-title" className="peta-stats-title">
          Ringkasan Lokasi
        </h2>
        <div className="peta-stats-grid">
          <div className="peta-stat-item">
            <span className="peta-stat-number">{stats.total.toLocaleString("id-ID")}</span>
            <span className="peta-stat-label">Total Tempat</span>
          </div>
          <div className="peta-stat-item">
            <span className="peta-stat-number green">{stats.accessible.toLocaleString("id-ID")}</span>
            <span className="peta-stat-label">Accessible</span>
          </div>
          <div className="peta-stat-item">
            <span className="peta-stat-number">{stats.partial.toLocaleString("id-ID")}</span>
            <span className="peta-stat-label">Partially Accessible</span>
          </div>
          <div className="peta-stat-item">
            <span className="peta-stat-number">{stats.unknown.toLocaleString("id-ID")}</span>
            <span className="peta-stat-label">Unknown</span>
          </div>
        </div>
      </section>

      {/* Daftar Lokasi */}
      <section className="peta-list-card" aria-labelledby="daftar-lokasi-title">
        <h2 id="daftar-lokasi-title" className="peta-stats-title">
          Daftar Lokasi
        </h2>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="peta-search-shell">
          <span style={{ color: "var(--muted)", fontSize: "16px" }} aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama tempat atau alamat..."
            aria-label="Cari nama tempat atau alamat"
          />
        </form>

        {/* Filters */}
        <div className="peta-filters-row">
          <div className="peta-select-shell">
            <select
              value={status}
              onChange={(e) => updateQuery({ status: e.target.value || null, page: "1" })}
              aria-label="Filter status aksesibilitas"
            >
              <option value="">Semua Status</option>
              <option value="accessible">Accessible</option>
              <option value="partial">Partially Accessible</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div className="peta-select-shell">
            <select
              value={category}
              onChange={(e) => updateQuery({ category: e.target.value === "Semua Kategori" ? null : e.target.value || null, page: "1" })}
              aria-label="Filter kategori"
            >
              {CATEGORY_FILTER_OPTIONS.map((cat) => (
                <option key={cat} value={cat === "Semua Kategori" ? "" : cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="peta-count-info">
          Menampilkan {startItem}–{endItem} dari {totalPlaces.toLocaleString("id-ID")} tempat
        </p>

        {/* List Items */}
        {places.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
            Belum ada data tempat manual yang sesuai.
          </div>
        ) : (
          <ul className="peta-places-list" aria-label="Daftar tempat manual">
            {places.map((place) => {
              const statusClass =
                place.accessibilityStatus === "accessible"
                  ? "accessible"
                  : place.accessibilityStatus === "partial"
                  ? "partial"
                  : "unknown";
              const statusLabel =
                place.accessibilityStatus === "accessible"
                  ? "Accessible"
                  : place.accessibilityStatus === "partial"
                  ? "Partially Accessible"
                  : "Unknown";

              return (
                <li key={place.id} className="peta-place-item">
                  <div className="peta-thumb-box">
                    <div className="peta-thumb-placeholder">
                      <span style={{ fontSize: "24px" }} aria-hidden="true">
                        🏢
                      </span>
                    </div>
                  </div>

                  <div className="peta-place-info">
                    <p className="peta-item-name">{place.name}</p>
                    <p className="peta-item-address">{place.address}</p>
                    <div className="peta-item-meta">
                      <span className="peta-item-category">
                        <span aria-hidden="true">🏬</span> {place.category || "Tempat Umum"}
                      </span>
                      <span className="badge active" style={{ fontSize: "11px", padding: "2px 8px" }}>
                        Manual
                      </span>
                    </div>
                  </div>

                  <div className="peta-item-actions-cell">
                    <span className={`peta-status-pill ${statusClass}`}>{statusLabel}</span>

                    <div className="peta-actions-btns">
                      <button
                        type="button"
                        className="peta-btn-edit"
                        onClick={() => setEditingPlace(place)}
                      >
                        <span aria-hidden="true">✏️</span> Ubah
                      </button>
                      <button
                        type="button"
                        className="peta-btn-delete"
                        onClick={() => setDeletingPlace(place)}
                      >
                        <span aria-hidden="true">🗑️</span> Hapus
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="peta-pagination" aria-label="Navigasi halaman daftar tempat">
            <Link
              href={`/admin/peta?${new URLSearchParams({
                ...Object.fromEntries(searchParams.entries()),
                page: String(Math.max(1, page - 1)),
              }).toString()}`}
              className={`peta-page-btn ${page <= 1 ? "disabled" : ""}`}
              aria-disabled={page <= 1}
            >
              ‹
            </Link>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <span key={p} style={{ display: "inline-flex", alignItems: "center" }}>
                    {showEllipsis && <span style={{ padding: "0 4px", color: "var(--muted)" }}>...</span>}
                    <Link
                      href={`/admin/peta?${new URLSearchParams({
                        ...Object.fromEntries(searchParams.entries()),
                        page: String(p),
                      }).toString()}`}
                      className={`peta-page-btn ${p === page ? "active" : ""}`}
                    >
                      {p}
                    </Link>
                  </span>
                );
              })}

            <Link
              href={`/admin/peta?${new URLSearchParams({
                ...Object.fromEntries(searchParams.entries()),
                page: String(Math.min(totalPages, page + 1)),
              }).toString()}`}
              className={`peta-page-btn ${page >= totalPages ? "disabled" : ""}`}
              aria-disabled={page >= totalPages}
            >
              ›
            </Link>
          </nav>
        )}
      </section>

      {/* Modals */}
      <PlaceFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <PlaceFormModal
        isOpen={Boolean(editingPlace)}
        onClose={() => setEditingPlace(null)}
        initialData={editingPlace}
      />

      <PlaceDeleteDialog
        isOpen={Boolean(deletingPlace)}
        onClose={() => setDeletingPlace(null)}
        place={deletingPlace}
      />
    </>
  );
}
