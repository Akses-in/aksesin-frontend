"use client";

import { useState, useTransition } from "react";
import { placeCategories } from "@/lib/preferences";
import { createManualPlaceAction, updateManualPlaceAction } from "./actions";

interface PlaceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id: string;
    name: string;
    category: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    accessibilityStatus: string;
    accessibilityAttributes: Record<string, string>;
  } | null;
}

const FACILITIES = [
  { key: "ramp", label: "Ramp / Jalur Landai" },
  { key: "elevator", label: "Lift Aksesibel" },
  { key: "toilets:wheelchair", label: "Toilet Disabilitas" },
  { key: "capacity:disabled", label: "Parkir Disabilitas" },
  { key: "tactile_paving", label: "Guiding Block" },
  { key: "wheelchair", label: "Akses Kursi Roda" },
];

export function PlaceFormModal({ isOpen, onClose, initialData }: PlaceFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isEdit = Boolean(initialData);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      let result;
      if (isEdit && initialData) {
        result = await updateManualPlaceAction(initialData.id, formData);
      } else {
        result = await createManualPlaceAction(formData);
      }

      if (result.ok) {
        onClose();
      } else {
        setErrorMsg(result.message ?? "Terjadi kesalahan.");
      }
    });
  }

  return (
    <div className="peta-modal-overlay" role="dialog" aria-modal="true">
      <div className="peta-modal-card">
        <div className="peta-modal-header">
          <h2>{isEdit ? "Ubah Lokasi Tempat" : "Tambah Tempat Baru"}</h2>
          <button
            type="button"
            className="text-button"
            onClick={onClose}
            disabled={isPending}
            style={{ fontSize: "18px", color: "var(--muted)" }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="error" style={{ marginBottom: "16px" }} role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="peta-form">
          <div className="peta-field">
            <label htmlFor="form-name">Nama Tempat *</label>
            <input
              id="form-name"
              name="name"
              type="text"
              required
              defaultValue={initialData?.name ?? ""}
              placeholder="Contoh: Grand Indonesia"
              className="peta-input"
            />
          </div>

          <div className="peta-field">
            <label htmlFor="form-category">Kategori *</label>
            <select
              id="form-category"
              name="category"
              required
              defaultValue={initialData?.category ?? "Pusat Perbelanjaan"}
              className="peta-input"
            >
              {placeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="peta-field">
            <label htmlFor="form-address">Alamat Lengkap *</label>
            <textarea
              id="form-address"
              name="address"
              required
              rows={2}
              defaultValue={initialData?.address ?? ""}
              placeholder="Contoh: Jl. M.H. Thamrin No. 1, Menteng, Jakarta Pusat"
              className="peta-input"
              style={{ resize: "vertical" }}
            />
            <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0" }}>
              💡 Koordinat peta akan dideteksi secara otomatis berdasarkan alamat lengkap di atas.
            </p>
          </div>

          <div className="peta-field">
            <label htmlFor="form-status">Status Aksesibilitas *</label>
            <select
              id="form-status"
              name="accessibilityStatus"
              defaultValue={initialData?.accessibilityStatus ?? "unknown"}
              className="peta-input"
            >
              <option value="unknown">Unknown</option>
              <option value="accessible">Accessible</option>
              <option value="partial">Partially Accessible</option>
            </select>
          </div>

          <div className="peta-field">
            <label>Fasilitas Aksesibilitas</label>
            <div className="peta-facilities-grid">
              {FACILITIES.map((facility) => {
                const isChecked = Boolean(
                  initialData?.accessibilityAttributes?.[facility.key] &&
                    initialData.accessibilityAttributes[facility.key] !== "no"
                );
                return (
                  <label key={facility.key} className="peta-facility-checkbox">
                    <input
                      type="checkbox"
                      name={facility.key}
                      value="yes"
                      defaultChecked={isChecked}
                    />
                    <span>{facility.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="peta-modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              disabled={isPending}
            >
              Batal
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={isPending}
              style={{ backgroundColor: "#15202e" }}
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
