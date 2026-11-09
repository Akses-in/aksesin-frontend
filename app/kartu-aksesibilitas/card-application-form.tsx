"use client";

import { useState, type ChangeEvent } from "react";
import {
  disabilityCategoryOptions,
  documentTypeOptions,
  formatFileSize,
  MAX_CARD_DOCUMENT_BYTES,
  type CardEvidenceRow,
  type DigitalCardRow,
} from "@/lib/digital-card";
import { accessibilityOptions } from "@/lib/preferences";
import { ActionForm } from "../_components/action-form";
import { Icon } from "../_components/site";
import {
  cancelCardApplication,
  submitCardApplication,
  updateCardApplication,
} from "./actions";

export function CardApplicationForm({
  defaultName,
  existingCard,
  existingEvidence,
}: {
  defaultName: string;
  existingCard?: DigitalCardRow;
  existingEvidence?: CardEvidenceRow | null;
}) {
  const isEdit = Boolean(existingCard);
  const [fullName, setFullName] = useState(existingCard?.full_name ?? defaultName);
  const [category, setCategory] = useState<string>(existingCard?.disability_category ?? "");
  const [documentType, setDocumentType] = useState<string>(
    existingEvidence?.document_type ?? "surat_keterangan",
  );
  const [notes, setNotes] = useState(existingCard?.notes ?? "");
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [fileClientError, setFileClientError] = useState("");

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFileClientError("");
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_CARD_DOCUMENT_BYTES) {
      setFileClientError("Ukuran berkas melebihi batas maksimal 5 MB.");
      setSelectedFile(null);
      return;
    }
    setSelectedFile({ name: file.name, size: file.size });
  }

  return (
    <ActionForm
      action={isEdit ? updateCardApplication : submitCardApplication}
      className="preferences-form"
    >
      {(pending, error) => (
        <>
          {existingCard && <input type="hidden" name="card_id" value={existingCard.id} />}

          <div className="field">
            <label htmlFor="full_name">Nama lengkap pada kartu</label>
            <div className="input-shell">
              <Icon name="register-user-round" size={18} />
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={fullName}
                disabled={pending}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap sesuai identitas"
                aria-describedby="full-name-hint"
              />
            </div>
            <p id="full-name-hint" className="small muted">
              2–100 karakter. Nama ini akan ditampilkan pada Digital Accessibility Card kamu.
            </p>
          </div>

          <fieldset
            className="choice-group"
            disabled={pending}
            aria-describedby="disability-category-hint"
          >
            <legend>Kategori disabilitas</legend>
            <p id="disability-category-hint" className="small muted">
              Pilih kategori utama yang paling menggambarkan kebutuhan profil aksesibilitasmu.
            </p>
            <div className="choice-grid">
              {disabilityCategoryOptions.map(([value, label]) => (
                <label className="choice" key={value}>
                  <input
                    type="radio"
                    name="disability_category"
                    value={value}
                    required
                    checked={category === value}
                    onChange={() => setCategory(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="choice-group" disabled={pending} aria-describedby="card-needs-hint">
            <legend>Kebutuhan fasilitas utama (opsional)</legend>
            <p id="card-needs-hint" className="small muted">
              Pilih fasilitas yang ingin dicantumkan pada profil kartu digitalmu.
            </p>
            <div className="choice-grid">
              {accessibilityOptions.map(([value, label]) => (
                <label className="choice" key={value}>
                  <span className="checkbox">
                    <input
                      type="checkbox"
                      name="needs"
                      value={value}
                      defaultChecked={existingCard?.needs.includes(value)}
                    />
                    <Icon name="preferences-check" size={13} />
                  </span>
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset
            className="choice-group"
            disabled={pending}
            aria-describedby="document-type-hint"
          >
            <legend>Jenis dokumen pendukung</legend>
            <p id="document-type-hint" className="small muted">
              Dokumen hanya digunakan oleh tim verifikasi dan tidak pernah ditampilkan pada QR publik.
            </p>
            <div className="choice-grid">
              {documentTypeOptions.map(([value, label]) => (
                <label className="choice" key={value}>
                  <input
                    type="radio"
                    name="document_type"
                    value={value}
                    required
                    checked={documentType === value}
                    onChange={() => setDocumentType(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="supporting_document">
              {isEdit
                ? "Unggah dokumen pendukung baru (opsional jika tidak diganti)"
                : "Unggah dokumen pendukung"}
            </label>
            <div className="file-upload-shell">
              <input
                id="supporting_document"
                name="supporting_document"
                type="file"
                required={!isEdit}
                disabled={pending}
                accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                aria-describedby="supporting-document-hint"
              />
            </div>
            <p id="supporting-document-hint" className="small muted">
              Format yang didukung: PDF, JPG, PNG, atau WebP (maksimal 5 MB).
            </p>
            {existingEvidence && !selectedFile && (
              <p className="small green" role="status">
                Dokumen saat ini: <strong>{existingEvidence.file_name}</strong> (
                {formatFileSize(existingEvidence.file_size)})
              </p>
            )}
            {selectedFile && (
              <p className="small green" role="status">
                Berkas dipilih: <strong>{selectedFile.name}</strong> (
                {formatFileSize(selectedFile.size)})
              </p>
            )}
            {fileClientError && (
              <p className="error" role="alert">
                {fileClientError}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="card_notes">Catatan tambahan (opsional)</label>
            <textarea
              id="card_notes"
              name="notes"
              rows={3}
              maxLength={500}
              value={notes}
              disabled={pending}
              onChange={(event) => setNotes(event.target.value)}
              aria-describedby="card-notes-hint"
            />
            <p id="card-notes-hint" className="small muted">
              {notes.length}/500 karakter · Hindari mencantumkan rekam medis detail atau nomor identitas pemerintah.
            </p>
          </div>

          <div className="preferences-actions">
            <label className="choice consent-choice">
              <span className="checkbox">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  defaultChecked={existingCard?.consent_given ?? false}
                />
                <Icon name="preferences-check" size={13} />
              </span>
              <span>
                Saya menyetujui pemrosesan data dan dokumen pendukung di atas untuk verifikasi Digital Accessibility Card Aksesin, serta memahami bahwa kartu ini bersifat opsional dan bukan kartu identitas resmi pemerintah maupun bukti diagnosis medis.
              </span>
            </label>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <div className="button-row">
              <button
                type="submit"
                className="button primary"
                disabled={pending || Boolean(fileClientError)}
              >
                {pending
                  ? "Menyimpan pengajuan…"
                  : isEdit
                    ? "Simpan perubahan pengajuan"
                    : "Ajukan kartu aksesibilitas"}
                <Icon name="preferences-arrow-right" size={17} />
              </button>
            </div>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function CancelCardApplicationForm({ cardId }: { cardId: string }) {
  return (
    <ActionForm action={cancelCardApplication} className="cancel-card-form">
      {(pending, error) => (
        <>
          <input type="hidden" name="card_id" value={cardId} />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button secondary danger-outline" disabled={pending}>
            {pending ? "Membatalkan pengajuan…" : "Batalkan pengajuan & tarik dokumen"}
          </button>
        </>
      )}
    </ActionForm>
  );
}

