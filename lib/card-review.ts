import type { CardStatus } from "./digital-card";

export type AdminDecision = "diproses" | "verified" | "perbaikan" | "rejected";

const VALID_DECISIONS = new Set<AdminDecision>(["diproses", "verified", "perbaikan", "rejected"]);

export function availableAdminDecisions(status: CardStatus): AdminDecision[] {
  if (status === "pending") return ["diproses", "verified", "perbaikan", "rejected"];
  if (status === "diproses") return ["verified", "perbaikan", "rejected"];
  if (status === "perbaikan") return ["diproses", "verified", "rejected"];
  return [];
}

export function validateDecisionInput(input: {
  decision: string;
  reason: string;
  validityMonths?: number;
}): { ok: true; decision: AdminDecision; reason: string; validityMonths?: number } | { ok: false; error: string } {
  if (!VALID_DECISIONS.has(input.decision as AdminDecision)) {
    return { ok: false, error: "Pilih keputusan verifikasi yang valid." };
  }
  const decision = input.decision as AdminDecision;
  const reason = input.reason.trim();
  if (reason.length > 500) {
    return { ok: false, error: "Catatan keputusan maksimal 500 karakter." };
  }
  if ((decision === "perbaikan" || decision === "rejected") && reason.length < 5) {
    return {
      ok: false,
      error: "Alasan wajib diisi minimal 5 karakter untuk permintaan perbaikan atau penolakan.",
    };
  }
  if (input.validityMonths !== undefined) {
    if (decision !== "verified") {
      return { ok: false, error: "Masa berlaku hanya dapat diatur saat menyetujui pengajuan." };
    }
    if (!Number.isInteger(input.validityMonths) || input.validityMonths < 1 || input.validityMonths > 60) {
      return { ok: false, error: "Masa berlaku harus bilangan bulat antara 1 hingga 60 bulan." };
    }
  }
  return {
    ok: true,
    decision,
    reason,
    ...(decision === "verified" && input.validityMonths !== undefined ? { validityMonths: input.validityMonths } : {}),
  };
}

export function validateRenewInput(input: {
  validityMonths: number;
  reason: string;
}): { ok: true; validityMonths: number; reason: string } | { ok: false; error: string } {
  if (!Number.isInteger(input.validityMonths) || input.validityMonths < 1 || input.validityMonths > 60) {
    return { ok: false, error: "Tambahan masa berlaku harus antara 1 hingga 60 bulan." };
  }
  const reason = input.reason.trim();
  if (reason.length > 500) {
    return { ok: false, error: "Catatan perpanjangan maksimal 500 karakter." };
  }
  return { ok: true, validityMonths: input.validityMonths, reason };
}

export function validateRevokeInput(input: {
  reason: string;
  confirm: boolean;
}): { ok: true; reason: string } | { ok: false; error: string } {
  const reason = input.reason.trim();
  if (reason.length < 5) {
    return { ok: false, error: "Alasan pencabutan wajib diisi minimal 5 karakter." };
  }
  if (reason.length > 500) {
    return { ok: false, error: "Alasan pencabutan maksimal 500 karakter." };
  }
  if (!input.confirm) {
    return { ok: false, error: "Centang konfirmasi pencabutan kartu terlebih dahulu." };
  }
  return { ok: true, reason };
}
