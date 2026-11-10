"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { addSavedPlace, removeSavedPlace, searchPlaces, type PlaceOption } from "./place-actions";

export type SavedPlace = PlaceOption & { savedId: string };

function describe(place: PlaceOption) {
  return [place.category, place.address].filter(Boolean).join(" · ");
}

export function SavedPlaces({ places }: { places: SavedPlace[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceOption[] | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState("");
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
      router.refresh();
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
      router.refresh();
    });
  }

  return (
    <>
      <form className="place-search" onSubmit={search}>        <div className="field">
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
      </form>

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
                )}              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="place-group">
        <p className="place-group-title">Tersimpan</p>
        {places.length ? (
          <ul className="saved-list" aria-label="Lokasi tersimpan">
            {places.map((place) => (
              <li key={place.savedId} className="saved-item">
                <div>
                  <p className="place-name">{place.name}</p>
                  <p className="place-meta">{describe(place)}</p>
                </div>
                {confirming === place.savedId ? (
                  <div className="saved-confirm">
                    <button type="button" className="text-button" disabled={pending} onClick={() => setConfirming("")}>
                      Batal
                    </button>
                    <button type="button" className="button secondary danger-outline" disabled={pending} onClick={() => remove(place.savedId)}>
                      {pending ? "Menghapus…" : "Ya, hapus"}
                    </button>
                  </div>
                ) : (
                  <button type="button" className="text-button text-danger" disabled={pending} onClick={() => setConfirming(place.savedId)}>
                    Hapus
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Belum ada lokasi tersimpan. Cari tempat di atas untuk menambahkannya.</p>
        )}
      </div>
    </>
  );
}
