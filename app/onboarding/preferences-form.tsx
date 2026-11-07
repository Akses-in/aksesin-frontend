"use client";

import { useState } from "react";
import { accessibilityOptions, disabilityOptions, type Preferences } from "@/lib/preferences";
import { savePreferences } from "../actions";
import { ActionForm } from "../_components/action-form";
import { Icon } from "../_components/site";

export function PreferencesForm({ preferences }: { preferences: Preferences | null }) {
  const [status, setStatus] = useState(preferences?.disability_status ?? "");
  const [notes, setNotes] = useState(preferences?.notes ?? "");

  return (
    <ActionForm action={savePreferences} className="preferences-form">
      {(pending, error) => (
        <>
          <fieldset className="choice-group" disabled={pending} aria-describedby="disability-hint">
            <legend>Status disabilitas (opsional)</legend>
            <p id="disability-hint" className="small muted">Pilih satu, atau biarkan kosong. Tidak ada jawaban yang wajib.</p>
            <div className="choice-grid disability-grid">
              {disabilityOptions.map(([value, label]) => (
                <label className="choice" key={value}>
                  <input type="radio" name="disability_status" value={value} checked={status === value}
                    onChange={() => setStatus(value)} />
                  {label}
                </label>
              ))}
            </div>
            {status && <button type="button" className="text-button" onClick={() => setStatus("")}>Kosongkan status</button>}
          </fieldset>

          <fieldset className="choice-group" disabled={pending} aria-describedby="needs-hint">
            <legend>Kebutuhan aksesibilitas (opsional)</legend>
            <p id="needs-hint" className="small muted">Pilih yang relevan. Kamu boleh memilih lebih dari satu.</p>
            <div className="choice-grid">
              {accessibilityOptions.map(([value, label]) => (
                <label className="choice" key={value}>
                  <span className="checkbox">
                    <input type="checkbox" name="needs" value={value} defaultChecked={preferences?.needs.includes(value)} />
                    <Icon name="preferences-check" size={13} />
                  </span>
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="notes">Ceritakan kebutuhanmu (opsional)</label>
            <textarea id="notes" name="notes" rows={3} maxLength={300} value={notes}
              disabled={pending} onChange={(event) => setNotes(event.target.value)} aria-describedby="notes-hint" />
            <p id="notes-hint" className="small muted">{notes.length}/300 karakter · Tidak perlu menulis diagnosis medis.</p>
          </div>

          <div className="preferences-actions">
            <p className="small muted">Dengan menyimpan, kamu memilih menggunakan jawaban di atas untuk personalisasi. Jika dilewati, akun tetap bisa digunakan tanpa menyimpan isian ini.</p>
            {error && <p className="error" role="alert">{error}</p>}
            <div className="button-row">
              <button type="submit" className="button secondary" form="skip-preferences" disabled={pending}>Lewati untuk sekarang</button>
              <button type="submit" className="button primary" disabled={pending}>
                {pending ? "Menyimpan…" : "Simpan preferensi"} <Icon name="preferences-arrow-right" size={17} />
              </button>
            </div>
          </div>
        </>
      )}
    </ActionForm>
  );
}
