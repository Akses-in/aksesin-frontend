"use client";

import { ArrowDown, ArrowUp, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { accessibilityOptions, placeCategories, type PlacePreferences } from "@/lib/preferences";
import { RetryButton } from "../_components/retry-button";
import { savePlacePreferences } from "./preferences-action";

export function PreferencesPanel({ preferences, unavailable }: { preferences: PlacePreferences; unavailable: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const facilityPicker = useRef<HTMLElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<PlacePreferences | null>(null);
  const [showFacilities, setShowFacilities] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [priorityUpdate, setPriorityUpdate] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [pending, startTransition] = useTransition();
  const saving = useRef(false);
  const count = preferences.needs.length + preferences.place_categories.length;
  const dirty = Boolean(draft && (
    draft.needs.length !== preferences.needs.length || draft.needs.some((need, i) => need !== preferences.needs[i]) ||
    draft.place_categories.length !== preferences.place_categories.length ||
    draft.place_categories.some((category) => !preferences.place_categories.includes(category))
  ));

  function openPanel() {
    setDraft(preferences);
    setShowFacilities(preferences.needs.length === 0);
    setConfirmDiscard(false);
    setFeedback("");
    setPriorityUpdate("");
    setAnnouncement("");
    dialog.current?.showModal();
    heading.current?.focus();
  }

  function requestClose() {
    if (saving.current) return;
    if (dirty) {
      setConfirmDiscard(true);
      requestAnimationFrame(() => continueButton.current?.focus());
      return;
    }
    dialog.current?.close();
  }

  function toggleFacility(need: string) {
    if (!draft) return;
    setDraft({ ...draft, needs: draft.needs.includes(need) ? draft.needs.filter((value) => value !== need) : [...draft.needs, need] });
    setFeedback("");
  }

  function moveFacility(index: number, direction: number, label: string, button: HTMLButtonElement) {
    if (!draft) return;
    const target = index + direction;
    if (target < 0 || target >= draft.needs.length) return;
    const ordered = [...draft.needs];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setDraft({ ...draft, needs: ordered });
    setFeedback("");
    setPriorityUpdate(`${label} dipindah ke prioritas ${target + 1}.`);
    requestAnimationFrame(() => button.focus());
  }

  function save() {
    if (!draft || !dirty || saving.current) return;
    const form = new FormData();
    draft.needs.forEach((need) => form.append("needs", need));
    draft.place_categories.forEach((category) => form.append("place_categories", category));
    saving.current = true;
    setFeedback("");
    startTransition(async () => {
      try {
        const error = await savePlacePreferences(form);
        if (error) {
          setFeedback(error);
          return;
        }
        setAnnouncement("Preferensi tersimpan.");
        dialog.current?.close();
      } catch {
        setFeedback("Preferensi belum tersimpan. Coba simpan lagi.");
      } finally {
        saving.current = false;
      }
    });
  }

  return (
    <>
      <button type="button" className="place-preferences-trigger" ref={trigger} aria-haspopup="dialog" onClick={openPanel}>
        <SlidersHorizontal size={17} aria-hidden="true" />
        Preferensi{count > 0 && <span className="place-preferences-count"><span className="places-visually-hidden">, jumlah pilihan </span>{count}</span>}
      </button>
      <p className="place-preferences-announcement" role="status">{announcement}</p>
      <dialog className="place-preferences-dialog" ref={dialog} aria-labelledby="place-preferences-title"
        onCancel={(event) => { event.preventDefault(); requestClose(); }}
        onClose={() => {
          if (dialog.current?.open) return;
          setDraft(null);
          trigger.current?.focus();
        }}>
        <div className="place-preferences-header">
          <div>
            <h2 id="place-preferences-title" tabIndex={-1} ref={heading}>Preferensi tempat</h2>
            <p className="small muted">Sesuaikan pencarian dengan kebutuhanmu.</p>
          </div>
          <button ref={closeButton} type="button" className="place-preferences-icon" aria-label="Tutup preferensi" disabled={pending} onClick={requestClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        {draft && (unavailable ? (
          <div className="place-preferences-body">
            <p className="error" role="alert">Preferensi belum bisa dimuat.</p>
            <RetryButton />
          </div>
        ) : (
          <form className="place-preferences-form" aria-busy={pending} onSubmit={(event) => { event.preventDefault(); save(); }}>
            <div className="place-preferences-body">
              <fieldset disabled={pending || confirmDiscard}>
                <legend>Prioritas fasilitas</legend>
                {draft.needs.length > 0 ? (
                  <>
                    <p className="small muted">Urutan teratas paling berpengaruh pada skor kecocokan.</p>
                    <ol className="place-priority-list" role="list" aria-label="Urutan prioritas fasilitas">
                      {draft.needs.map((need, index) => {
                        const label = accessibilityOptions.find(([value]) => value === need)?.[1] ?? need;
                        return (
                          <li key={need}>
                            <span className="place-priority-number" aria-hidden="true">{index + 1}</span>
                            <span>{label}</span>
                            <div className="place-priority-actions">
                              <button type="button" className="place-preferences-icon" aria-label={`Naikkan prioritas ${label}`} aria-disabled={index === 0}
                                onClick={(event) => moveFacility(index, -1, label, event.currentTarget)}><ArrowUp size={17} aria-hidden="true" /></button>
                              <button type="button" className="place-preferences-icon" aria-label={`Turunkan prioritas ${label}`} aria-disabled={index === draft.needs.length - 1}
                                onClick={(event) => moveFacility(index, 1, label, event.currentTarget)}><ArrowDown size={17} aria-hidden="true" /></button>
                              <button type="button" className="place-preferences-icon" aria-label={`Hapus ${label}`} onClick={() => {
                                toggleFacility(need);
                                facilityPicker.current?.focus();
                              }}><X size={17} aria-hidden="true" /></button>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </>
                ) : <p className="place-preferences-empty">Belum ada prioritas. Pilih fasilitas yang penting saat kamu berkunjung.</p>}
                <p className="places-visually-hidden" role="status">{priorityUpdate}</p>
                <details className="place-facility-picker" open={showFacilities} onToggle={(event) => setShowFacilities(event.currentTarget.open)}>
                  <summary ref={facilityPicker}>Pilih fasilitas <ChevronDown size={18} aria-hidden="true" /></summary>
                  <div className="place-preference-options">
                    {accessibilityOptions.map(([value, label]) => (
                      <label key={value}>
                        <input type="checkbox" value={value} checked={draft.needs.includes(value)} onChange={() => toggleFacility(value)} />
                        {label}
                      </label>
                    ))}
                  </div>
                </details>
              </fieldset>
              <fieldset disabled={pending || confirmDiscard}>
                <legend>Jenis tempat</legend>
                <p className="small muted">Jenis pilihanmu akan ditandai di hasil pencarian.</p>
                <div className="place-preference-options">
                  {placeCategories.map((category) => (
                    <label key={category}>
                      <input type="checkbox" name="place_categories" value={category} checked={draft.place_categories.includes(category)}
                        onChange={(event) => {
                          setDraft({ ...draft, place_categories: event.target.checked
                            ? [...draft.place_categories, category] : draft.place_categories.filter((value) => value !== category) });
                          setFeedback("");
                        }} />
                      {category}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            <div className="place-preferences-footer">
              {feedback && <p className="error" role="alert">{feedback}</p>}
              {confirmDiscard ? (
                <>
                  <p className="small" role="status">Buang perubahan yang belum disimpan?</p>
                  <div className="place-preferences-footer-actions">
                    <button type="button" className="button secondary" onClick={() => dialog.current?.close()}>Buang perubahan</button>
                    <button type="button" ref={continueButton} className="button primary" onClick={(event) => {
                      event.preventDefault();
                      setConfirmDiscard(false);
                      closeButton.current?.focus();
                    }}>Lanjut mengedit</button>
                  </div>
                </>
              ) : (
                <>
                  <p className="small muted" role="status">{dirty ? "Ada perubahan yang belum disimpan." : count ? "Preferensi tersimpan di akunmu." : "Setiap pilihan bersifat opsional."}</p>
                  <div className="place-preferences-footer-actions">
                    <button type="button" className="button secondary" onClick={requestClose} disabled={pending}>Tutup</button>
                    <button className="button primary" disabled={pending || !dirty} type="submit">
                      {pending ? "Menyimpan…" : "Simpan preferensi"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        ))}
      </dialog>
    </>
  );
}
