"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { formatDateId } from "@/lib/digital-card";
import { savedPlaceLabelLimit, savedPlaceNoteLimit, type PlaceOption, type SavedPlace } from "@/lib/saved-places";
import { ActionForm } from "../_components/action-form";
import { addSavedPlace, removeSavedPlace, searchPlaces, updateSavedPlace } from "./place-actions";

function describe(place: PlaceOption) {
  return [place.category, place.address].filter(Boolean).join(" · ");
}

export function SavedPlaces({ places, showSearch = true }: { places: SavedPlace[]; showSearch?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceOption[] | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState("");
  const [editing, setEditing] = useState("");
  const [pending, startTransition] = useTransition();
  const savedIds = new Set(places.map((place) => place.id));

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    setNote("");
    setError("");
    if (value.length < 2) {
      setResults(null);
      setError("Tulis minimal 2 karakter untuk mencari tempat.");
      return;
    }
    startTransition(async () => {
      const found = await searchPlaces(value);
      setResults(found);
      if (!found.length) setError("Tempat tidak ditemukan. Coba kata lain.");
    });
  }

  function save(placeId: string) {
    setNote("");
    setError("");
    startTransition(async () => {
      const message = await addSavedPlace(placeId);
      if (message) {
        setError(message);
        return;
      }
      setQuery("");
      setResults(null);
      setNote("Lokasi disimpan.");
    });
  }

  function remove(id: string) {
    setNote("");
    setError("");
    startTransition(async () => {
      const message = await removeSavedPlace(id);
      if (message) {
        setError(message);
        return;
      }
      setConfirming("");
      setNote("Lokasi dihapus.");
    });
  }

  return (
    <>
      {showSearch && <form className="place-search" onSubmit={search}>
        <div className="field">
          <label htmlFor="place-query">Cari tempat</label>
          <div className="input-shell">
            <input id="place-query" name="query" type="search" value={query} maxLength={60}
              placeholder="Contoh: Stasiun MRT" disabled={pending} aria-describedby="place-query-hint"
              onChange={(event) => setQuery(event.target.value)} />
          </div>
          <p id="place-query-hint" className="small muted">Ketik nama tempat, lalu simpan dari hasil pencarian.</p>
        </div>
        <button type="submit" className="button secondary" disabled={pending}>
          {pending ? "Memproses…" : "Cari tempat"}
        </button>
      </form>}

      {error && <p className="error" role="alert">{error}</p>}
      {note && <p className="notice" role="status">{note}</p>}

      {results && results.length > 0 && (
        <div className="place-group">
          <p className="place-group-title">Hasil pencarian</p>
          <ul className="place-results" aria-label="Hasil pencarian tempat">
            {results.map((place) => (
              <li key={place.id}>
                <div>
                  <p className="place-name">{place.name}</p>
                  <p className="place-meta">{describe(place)}</p>
                </div>
                {savedIds.has(place.id) ? (
                  <p className="place-saved small muted">Sudah tersimpan</p>
                ) : (
                  <button type="button" className="button secondary" disabled={pending} onClick={() => save(place.id)}>
                    Simpan
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="place-group">
        {showSearch && <p className="place-group-title">Tersimpan</p>}
        {places.length ? (
          <ul className="saved-list" aria-label="Lokasi tersimpan">
            {places.map((place) => (
              <li key={place.savedId} className="saved-item">
                <div>
                  <p className="place-name">{place.label || place.name}</p>
                  {place.label && <p className="place-meta">{place.name}</p>}
                  <p className="place-meta">{describe(place)}</p>
                  {place.note && <p className="small saved-notes">{place.note}</p>}
                  <p className="place-meta">Disimpan {formatDateId(place.createdAt)}</p>
                </div>
                {editing === place.savedId ? (
                  <ActionForm className="saved-edit" action={async (form) => {
                    setNote("");
                    const message = await updateSavedPlace(place.savedId, form);
                    if (!message) {
                      setEditing("");
                      setNote("Simpanan diperbarui.");
                    }
                    return message;
                  }}>
                    {(updating, updateError) => (
                      <>
                        <label className="field">
                          <span>Nama simpanan (opsional)</span>
                          <span className="input-shell">
                            <input name="label" defaultValue={place.label ?? ""} placeholder={place.name}
                              maxLength={savedPlaceLabelLimit} disabled={updating} />
                          </span>
                        </label>
                        <label className="field">
                          <span>Catatan pribadi (opsional)</span>
                          <textarea name="note" defaultValue={place.note ?? ""} maxLength={savedPlaceNoteLimit} disabled={updating} />
                        </label>
                        {updateError && <p className="error" role="alert">{updateError}</p>}
                        <div className="saved-confirm">
                          <button type="submit" className="button primary" disabled={updating}>
                            {updating ? "Menyimpan…" : "Simpan perubahan"}
                          </button>
                          <button type="button" className="text-button" disabled={updating} onClick={() => setEditing("")}>Batal</button>
                        </div>
                      </>
                    )}
                  </ActionForm>
                ) : confirming === place.savedId ? (
                  <div className="saved-confirm">
                    <button type="button" className="text-button" disabled={pending} onClick={() => setConfirming("")}>
                      Batal
                    </button>
                    <button type="button" className="button secondary danger-outline" disabled={pending} onClick={() => remove(place.savedId)}>
                      {pending ? "Menghapus…" : "Ya, hapus"}
                    </button>
                  </div>
                ) : (
                  <div className="saved-confirm">
                    <button type="button" className="text-button" disabled={pending || Boolean(editing)}
                      aria-label={`Ubah simpanan ${place.label || place.name}`}
                      onClick={() => {
                        setConfirming("");
                        setError("");
                        setNote("");
                        setEditing(place.savedId);
                      }}>
                      Ubah
                    </button>
                    <button type="button" className="text-button text-danger" disabled={pending || Boolean(editing)}
                      aria-label={`Hapus simpanan ${place.label || place.name}`}
                      onClick={() => setConfirming(place.savedId)}>
                      Hapus
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-activity-card" role="status">
            <p className="empty-activity-title">Belum ada lokasi yang disimpan.</p>
            <Link className="text-button inline-link" href="/beranda">Cari lokasi di peta</Link>
          </div>
        )}
      </div>
    </>
  );
}
