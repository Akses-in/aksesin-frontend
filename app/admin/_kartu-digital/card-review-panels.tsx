"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import type { CardStatus } from "@/lib/digital-card";
import { renewIssuedCard, revokeIssuedCard, submitCardDecision } from "./actions";
import {
  availableAdminDecisions,
  validateDecisionInput,
  validateRenewInput,
  validateRevokeInput,
  type AdminDecision,
} from "./labels";

const decisionLabels: Record<AdminDecision, string> = {
  diproses: "Tandai sedang diproses",
  verified: "Setujui & terbitkan kartu",
  perbaikan: "Minta perbaikan dokumen",
  rejected: "Tolak pengajuan",
};

export function CardDecisionPanel({
  cardId,
  status,
  applicantName,
}: {
  cardId: string;
  status: CardStatus;
  applicantName: string;
}) {
  const router = useRouter();
  const options = availableAdminDecisions(status);
  const [decision, setDecision] = useState<AdminDecision>(options[0] ?? "diproses");
  const [reason, setReason] = useState("");
  const [validityMonths, setValidityMonths] = useState("12");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const fieldId = useId();

  if (options.length === 0) return null;

  const requiresReason = decision === "perbaikan" || decision === "rejected";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const parsedMonths = decision === "verified" ? Number(validityMonths) : undefined;
    const check = validateDecisionInput({
      decision,
      reason,
      validityMonths: parsedMonths,
    });
    if (!check.ok) {
      setError(check.error);
      return;
    }

    startTransition(async () => {
      const result = await submitCardDecision(cardId, {
        decision: check.decision,
        reason: check.reason,
        validityMonths: check.validityMonths,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice(
        check.decision === "verified"
          ? `Pengajuan ${applicantName} disetujui dan kartu digital telah diterbitkan.`
          : `Status pengajuan ${applicantName} berhasil diperbarui.`,
      );
      setReason("");
      router.refresh();
    });
  }

  return (
    <section className="status-card" aria-labelledby={`${fieldId}-title`}>
      <div>
        <p className="small muted">KEPUTUSAN VERIFIKASI</p>
        <h2 id={`${fieldId}-title`}>Tindak lanjuti pengajuan</h2>
      </div>

      <form className="page-stack" onSubmit={handleSubmit} aria-busy={pending}>
        <div className="field">
          <label htmlFor={`${fieldId}-decision`}>Pilih keputusan</label>
          <div className="input-shell">
            <select
              id={`${fieldId}-decision`}
              value={decision}
              onChange={(event) => {
                setDecision(event.target.value as AdminDecision);
                setError("");
              }}
            >
              {options.map((item) => (
                <option key={item} value={item}>
                  {decisionLabels[item]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {decision === "verified" && (
          <div className="field">
            <label htmlFor={`${fieldId}-validity`}>Masa berlaku kartu (bulan)</label>
            <div className="input-shell">
              <input
                id={`${fieldId}-validity`}
                type="number"
                min={1}
                max={60}
                step={1}
                value={validityMonths}
                onChange={(event) => setValidityMonths(event.target.value)}
                required
              />
            </div>
            <p className="small muted">Default 12 bulan (rentang 1–60 bulan).</p>
          </div>
        )}

        <div className="field">
          <label htmlFor={`${fieldId}-reason`}>
            {requiresReason ? "Alasan / catatan keputusan (wajib, minimal 5 karakter)" : "Catatan verifikasi (opsional)"}
          </label>
          <div className="input-shell">
            <textarea
              id={`${fieldId}-reason`}
              rows={3}
              maxLength={500}
              required={requiresReason}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                requiresReason
                  ? "Jelaskan kekurangan dokumen atau alasan penolakan secara spesifik."
                  : "Catatan tambahan untuk pemohon atau audit internal."
              }
            />
          </div>
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="notice" role="status">{notice}</p>}

        <div className="button-row">
          <button type="submit" className="button primary" disabled={pending}>
            {pending ? "Menyimpan keputusan…" : decisionLabels[decision]}
          </button>
        </div>
      </form>
    </section>
  );
}

export function CardLifecyclePanel({
  cardId,
  cardNumber,
  status,
}: {
  cardId: string;
  cardNumber: string;
  status: CardStatus;
}) {
  const router = useRouter();
  const [renewMonths, setRenewMonths] = useState("12");
  const [renewReason, setRenewReason] = useState("");
  const [renewError, setRenewError] = useState("");
  const [renewNotice, setRenewNotice] = useState("");
  const [renewPending, startRenew] = useTransition();

  const [revokeReason, setRevokeReason] = useState("");
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const [revokeError, setRevokeError] = useState("");
  const [revokeNotice, setRevokeNotice] = useState("");
  const [revokePending, startRevoke] = useTransition();
  const fieldId = useId();

  if (status !== "verified") return null;

  function handleRenew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRenewError("");
    setRenewNotice("");
    const check = validateRenewInput({
      validityMonths: Number(renewMonths),
      reason: renewReason,
    });
    if (!check.ok) {
      setRenewError(check.error);
      return;
    }

    startRenew(async () => {
      const result = await renewIssuedCard(cardId, {
        validityMonths: check.validityMonths,
        reason: check.reason,
      });
      if (!result.ok) {
        setRenewError(result.message);
        return;
      }
      setRenewNotice(`Masa berlaku kartu ${cardNumber} berhasil diperpanjang ${check.validityMonths} bulan.`);
      setRenewReason("");
      router.refresh();
    });
  }

  function handleRevoke(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRevokeError("");
    setRevokeNotice("");
    const check = validateRevokeInput({
      reason: revokeReason,
      confirm: revokeConfirm,
    });
    if (!check.ok) {
      setRevokeError(check.error);
      return;
    }

    startRevoke(async () => {
      const result = await revokeIssuedCard(cardId, {
        reason: check.reason,
        confirm: true,
      });
      if (!result.ok) {
        setRevokeError(result.message);
        return;
      }
      setRevokeNotice(`Kartu ${cardNumber} telah dicabut dan QR verifikasi dinonaktifkan.`);
      setRevokeReason("");
      setRevokeConfirm(false);
      router.refresh();
    });
  }

  return (
    <div className="card-admin-lifecycle-grid">
      <section className="status-card" aria-labelledby={`${fieldId}-renew-title`}>
        <div>
          <p className="small muted">PERPANJANGAN KARTU</p>
          <h2 id={`${fieldId}-renew-title`}>Perpanjang masa berlaku</h2>
        </div>

        <form className="page-stack" onSubmit={handleRenew} aria-busy={renewPending}>
          <div className="field">
            <label htmlFor={`${fieldId}-renew-months`}>Tambah durasi (bulan)</label>
            <div className="input-shell">
              <select
                id={`${fieldId}-renew-months`}
                value={renewMonths}
                onChange={(event) => setRenewMonths(event.target.value)}
              >
                <option value="6">6 bulan</option>
                <option value="12">12 bulan</option>
                <option value="24">24 bulan</option>
                <option value="36">36 bulan</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor={`${fieldId}-renew-reason`}>Catatan perpanjangan (opsional)</label>
            <div className="input-shell">
              <input
                id={`${fieldId}-renew-reason`}
                type="text"
                maxLength={500}
                value={renewReason}
                onChange={(event) => setRenewReason(event.target.value)}
                placeholder="Contoh: Perpanjangan berkala tahunan"
              />
            </div>
          </div>

          {renewError && <p className="error" role="alert">{renewError}</p>}
          {renewNotice && <p className="notice" role="status">{renewNotice}</p>}

          <div className="button-row">
            <button type="submit" className="button secondary" disabled={renewPending}>
              {renewPending ? "Memperpanjang…" : "Perpanjang masa berlaku"}
            </button>
          </div>
        </form>
      </section>

      <section className="status-card" aria-labelledby={`${fieldId}-revoke-title`}>
        <div>
          <p className="small muted">PENCABUTAN KARTU</p>
          <h2 id={`${fieldId}-revoke-title`}>Cabut kartu digital</h2>
        </div>
        <p className="small muted">
          Pencabutan bersifat permanen untuk pengajuan ini dan langsung menonaktifkan hasil verifikasi QR publik.
        </p>

        <form className="page-stack" onSubmit={handleRevoke} aria-busy={revokePending}>
          <div className="field">
            <label htmlFor={`${fieldId}-revoke-reason`}>Alasan pencabutan (wajib, minimal 5 karakter)</label>
            <div className="input-shell">
              <textarea
                id={`${fieldId}-revoke-reason`}
                rows={3}
                maxLength={500}
                required
                value={revokeReason}
                onChange={(event) => setRevokeReason(event.target.value)}
                placeholder="Jelaskan alasan pencabutan kartu."
              />
            </div>
          </div>

          <label className="consent-checkbox" htmlFor={`${fieldId}-revoke-confirm`}>
            <input
              id={`${fieldId}-revoke-confirm`}
              type="checkbox"
              checked={revokeConfirm}
              onChange={(event) => setRevokeConfirm(event.target.checked)}
            />
            <span>Saya yakin ingin mencabut kartu {cardNumber} dan menonaktifkan QR-nya.</span>
          </label>

          {revokeError && <p className="error" role="alert">{revokeError}</p>}
          {revokeNotice && <p className="notice" role="status">{revokeNotice}</p>}

          <div className="button-row">
            <button type="submit" className="button secondary danger-outline" disabled={revokePending}>
              {revokePending ? "Mencabut kartu…" : "Cabut kartu sekarang"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
