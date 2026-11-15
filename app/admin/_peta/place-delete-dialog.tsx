"use client";

import { useTransition } from "react";
import { deleteManualPlaceAction } from "./actions";

interface PlaceDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  place: {
    id: string;
    name: string;
  } | null;
}

export function PlaceDeleteDialog({ isOpen, onClose, place }: PlaceDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !place) return null;

  function handleDelete() {
    if (!place) return;
    startTransition(async () => {
      const res = await deleteManualPlaceAction(place.id);
      if (res.ok) {
        onClose();
      } else {
        alert(res.message ?? "Gagal menghapus tempat.");
      }
    });
  }

  return (
    <div className="peta-modal-overlay" role="dialog" aria-modal="true">
      <div className="peta-modal-card" style={{ maxWidth: "420px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
          Hapus Lokasi Tempat
        </h2>
        <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "20px" }}>
          Apakah kamu yakin ingin menghapus <strong>{place.name}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>

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
            type="button"
            className="button danger"
            onClick={handleDelete}
            disabled={isPending}
            style={{ backgroundColor: "#c92a2a", color: "#ffffff" }}
          >
            {isPending ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
