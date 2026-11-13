"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { deleteAdminPlace, updateAdminPlace } from "./actions";
import {
  accessibilityAttributeKeys,
  accessibilityStatusMeta,
  attributeLabels,
  placeCategories,
  type AccessibilityAttributeKey,
  type AccessibilityAttributes,
  type AccessibilityStatus,
  type AdminPlace,
  type DeleteReason,
  type PlaceUpdate,
} from "./labels";

const choiceKeys = new Set<AccessibilityAttributeKey>([
  "wheelchair", "toilets:wheelchair", "ramp", "ramp:wheelchair", "elevator", "tactile_paving",
]);
const choiceOptions = [["", "Belum ada informasi"], ["yes", "Ya (yes)"], ["limited", "Terbatas (limited)"], ["no", "Tidak (no)"]];

function deleteWarning(place: AdminPlace) {
  const parts = [
    place.savedCount > 0
      ? `${place.savedCount} lokasi tersimpan pengguna ikut terhapus.`
      : "Lokasi tersimpan pengguna untuk tempat ini ikut terhapus.",
  ];
  if (place.contributionCount > 0) parts.push(`${place.contributionCount} kontribusi pengguna juga ikut terhapus.`);
  if (place.dataSource === "osm") parts.push("Tempat ini tidak akan masuk lagi saat impor ulang.");
  return parts.join(" ");
}

function DeletePlaceButton({ place, reason, onDeleted }: {
  place: AdminPlace;
  reason: DeleteReason;
  onDeleted: (message: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const warningId = useId();

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (restoreFocus.current) triggerRef.current?.focus();
  }, [confirming]);

  function cancel() {
    restoreFocus.current = true;
    setConfirming(false);
  }

  function remove() {
    setError("");
    startTransition(async () => {
      const response = await deleteAdminPlace(place.id, reason);
      if (!response.ok) {
        setError(response.message);
        return;
      }
      const { savedByCount, contributionCount } = response.data;
      onDeleted(`"${response.data.name}" dihapus. ${savedByCount} lokasi tersimpan dan ${contributionCount} kontribusi ikut terhapus.`);
    });
  }

  return (
    <div className="osm-delete">
      {confirming ? (
        <div className="osm-confirm" role="group" aria-labelledby={warningId}>
          <p id={warningId} className="small text-danger">
            Hapus &ldquo;{place.name}&rdquo;? {deleteWarning(place)}
          </p>
          <div className="saved-confirm">
            <button ref={cancelRef} type="button" className="text-button" disabled={pending} onClick={cancel}>Batal</button>
            <button type="button" className="button secondary danger-outline" disabled={pending} onClick={remove}>
              {pending ? "Menghapus…" : "Ya, hapus tempat"}
            </button>
          </div>
        </div>
      ) : (
        <button ref={triggerRef} type="button" className="text-button text-danger" onClick={() => setConfirming(true)}>
          Hapus<span className="osm-visually-hidden"> {place.name}</span>
        </button>
      )}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

function readNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim().replace(",", ".");
  return text === "" ? null : Number(text);
}

function sameAttributes(a: AccessibilityAttributes, b: AccessibilityAttributes) {
  return accessibilityAttributeKeys.every((key) => (a[key] ?? "") === (b[key] ?? ""));
}

function EditPlaceForm({ place, onDone }: { place: AdminPlace; onDone: (message: string) => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const formId = useId();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => nameRef.current?.focus(), []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const update: PlaceUpdate = {};

    for (const key of ["name", "category", "address"] as const) {
      const value = String(form.get(key) ?? "").trim();
      if (value !== place[key]) update[key] = value;
    }
    if (!update.name && update.name !== undefined) {
      setError("Nama tempat wajib diisi.");
      return;
    }

    const latitude = readNumber(form.get("latitude"));
    const longitude = readNumber(form.get("longitude"));
    if ((latitude === null) !== (longitude === null) || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError("Isi latitude dan longitude dengan angka, misalnya -6.1754 dan 106.8272.");
      return;
    }
    if (latitude !== null && longitude !== null && (latitude !== place.latitude || longitude !== place.longitude)) {
      update.latitude = latitude;
      update.longitude = longitude;
    }

    const status = String(form.get("accessibilityStatus")) as AccessibilityStatus;
    if (status !== place.accessibilityStatus) update.accessibilityStatus = status;

    const attributes: AccessibilityAttributes = {};
    for (const key of accessibilityAttributeKeys) {
      const value = String(form.get(`attr:${key}`) ?? "").trim();
      if (value) attributes[key] = value;
    }
    if (!sameAttributes(attributes, place.accessibilityAttributes)) {
      update.accessibilityAttributes = Object.fromEntries(accessibilityAttributeKeys.map((key) => [key, attributes[key] ?? ""]));
    }

    if (!Object.keys(update).length) {
      setError("Belum ada perubahan untuk disimpan.");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await updateAdminPlace(place.id, update);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onDone(place.dataSource === "osm"
        ? "Perubahan disimpan. Tempat ini tidak akan ditimpa impor ulang."
        : "Perubahan disimpan.");
      router.refresh();
    });
  }

  const field = (name: string) => `${formId}-${name}`;

  return (
    <form className="osm-edit-form" onSubmit={submit} aria-busy={pending} aria-label={`Ubah data ${place.name}`}>
      <div className="osm-form-grid">
        <div className="field">
          <label htmlFor={field("name")}>Nama tempat</label>
          <div className="input-shell">
            <input ref={nameRef} id={field("name")} name="name" defaultValue={place.name} maxLength={200} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor={field("category")}>Kategori</label>
          <div className="input-shell">
            <input id={field("category")} name="category" defaultValue={place.category} maxLength={80}
              list={field("categories")} />
          </div>
          <datalist id={field("categories")}>
            {placeCategories.map((category) => <option key={category} value={category} />)}
          </datalist>
        </div>
        <div className="field osm-field-wide">
          <label htmlFor={field("address")}>Alamat</label>
          <div className="input-shell">
            <input id={field("address")} name="address" defaultValue={place.address} maxLength={300} />
          </div>
        </div>
        <div className="field">
          <label htmlFor={field("latitude")}>Latitude</label>
          <div className="input-shell">
            <input id={field("latitude")} name="latitude" inputMode="decimal" defaultValue={place.latitude ?? ""}
              aria-describedby={field("coordinate-hint")} />
          </div>
        </div>
        <div className="field">
          <label htmlFor={field("longitude")}>Longitude</label>
          <div className="input-shell">
            <input id={field("longitude")} name="longitude" inputMode="decimal" defaultValue={place.longitude ?? ""}
              aria-describedby={field("coordinate-hint")} />
          </div>
        </div>
        <p id={field("coordinate-hint")} className="small muted osm-field-wide">Koordinat harus berada di daratan Jakarta.</p>
        <div className="field osm-field-wide">
          <label htmlFor={field("status")}>Status aksesibilitas</label>
          <div className="input-shell">
            <select id={field("status")} name="accessibilityStatus" defaultValue={place.accessibilityStatus}>
              {Object.entries(accessibilityStatusMeta).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <fieldset className="osm-form-grid">
        <legend className="osm-legend">Atribut aksesibilitas</legend>
        {accessibilityAttributeKeys.map((key) => {
          const current = place.accessibilityAttributes[key] ?? "";
          const id = field(key);
          if (choiceKeys.has(key)) {
            const options = choiceOptions.some(([value]) => value === current) ? choiceOptions : [...choiceOptions, [current, current]];
            return (
              <div className="field" key={key}>
                <label htmlFor={id}>{attributeLabels[key]}</label>
                <div className="input-shell">
                  <select id={id} name={`attr:${key}`} defaultValue={current}>
                    {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </div>
            );
          }
          return (
            <div className={key === "wheelchair:description" ? "field osm-field-wide" : "field"} key={key}>
              <label htmlFor={id}>{attributeLabels[key]}</label>
              <div className="input-shell">
                <input id={id} name={`attr:${key}`} defaultValue={current} maxLength={500}
                  placeholder={key === "capacity:disabled" ? "Contoh: 2" : "Contoh: Pintu utama memakai ramp landai"} />
              </div>
            </div>
          );
        })}
      </fieldset>

      {error && <p className="error" role="alert">{error}</p>}
      <div className="button-row osm-form-actions">
        <button type="submit" className="button primary" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </div>
    </form>
  );
}

// Membungkus ringkasan dari server supaya seluruh item hilang setelah dihapus,
// lalu fokus pindah ke pesan hasil karena tombol yang sedang difokus ikut hilang.
export function PlaceItem({ place, reason, editable = false, children }: {
  place: AdminPlace;
  reason: DeleteReason;
  editable?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [deleted, setDeleted] = useState("");
  const deletedRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (deleted) deletedRef.current?.focus();
  }, [deleted]);

  if (deleted) {
    return (
      <div ref={deletedRef} className="osm-inline-result" tabIndex={-1}>
        <p className="notice" role="status">{deleted}</p>
        <button type="button" className="text-button" onClick={() => router.refresh()}>Muat ulang daftar</button>
      </div>
    );
  }

  return (
    <>
      {children}
      <div className="osm-place-actions">
        <div className="osm-action-row">
          {editable && (
            <button type="button" className="text-button" aria-expanded={editing} aria-controls={panelId}
              onClick={() => { setEditing((value) => !value); setNotice(""); }}>
              {editing ? "Tutup form ubah" : "Ubah"}<span className="osm-visually-hidden"> {place.name}</span>
            </button>
          )}
          <DeletePlaceButton place={place} reason={reason} onDeleted={setDeleted} />
        </div>
        {notice && <p className="notice" role="status">{notice}</p>}
        {editable && (
          <div id={panelId} hidden={!editing}>
            {editing && <EditPlaceForm place={place} onDone={(message) => { setEditing(false); setNotice(message); }} />}
          </div>
        )}
      </div>
    </>
  );
}
