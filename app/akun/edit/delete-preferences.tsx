"use client";

import { useState } from "react";
import { ActionForm } from "../../_components/action-form";
import { clearPreferences } from "../../actions";

export function DeletePreferences() {
  const [confirming, setConfirming] = useState(false);

  return (
    <section className="panel profile-sheet">
      <div className="profile-block">
        <div className="profile-block-head">
          <h2>Hapus data aksesibilitas</h2>
        </div>
        <p className="muted">
          {confirming
            ? "Setelah dihapus, isian ini tidak bisa dikembalikan. Kamu bisa mengisinya lagi kapan saja."
            : "Status disabilitas, kebutuhan, dan catatan akan dikosongkan. Nama dan nomor WhatsApp tidak berubah."}
        </p>
        {confirming ? (
          <ActionForm action={clearPreferences} className="credentials-form">
            {(pending, error) => (
              <>
                {error && <p className="error" role="alert">{error}</p>}
                <div className="button-row">
                  <button type="button" className="button secondary" disabled={pending} onClick={() => setConfirming(false)}>
                    Batal
                  </button>
                  <button type="submit" className="button danger" disabled={pending}>
                    {pending ? "Menghapus…" : "Ya, hapus data"}
                  </button>
                </div>
              </>
            )}
          </ActionForm>
        ) : (
          <button type="button" className="button secondary danger-outline" onClick={() => setConfirming(true)}>
            Hapus data aksesibilitas
          </button>
        )}
      </div>
    </section>
  );
}
