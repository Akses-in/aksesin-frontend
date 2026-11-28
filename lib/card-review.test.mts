import assert from "node:assert/strict";
import { test } from "node:test";
import {
  availableAdminDecisions,
  validateDecisionInput,
  validateRenewInput,
  validateRevokeInput,
} from "./card-review.ts";

test("menentukan opsi keputusan admin yang sah per status pengajuan", () => {
  assert.deepEqual(availableAdminDecisions("pending"), ["diproses", "verified", "perbaikan", "rejected"]);
  assert.deepEqual(availableAdminDecisions("diproses"), ["verified", "perbaikan", "rejected"]);
  assert.deepEqual(availableAdminDecisions("perbaikan"), ["diproses", "verified", "rejected"]);
  assert.deepEqual(availableAdminDecisions("verified"), []);
  assert.deepEqual(availableAdminDecisions("rejected"), []);
  assert.deepEqual(availableAdminDecisions("dicabut"), []);
  assert.deepEqual(availableAdminDecisions("dibatalkan"), []);
});

test("memvalidasi keputusan verifikasi dan kewajiban alasan", () => {
  assert.equal(validateDecisionInput({ decision: "salah", reason: "" }).ok, false);
  assert.equal(validateDecisionInput({ decision: "perbaikan", reason: "" }).ok, false);
  assert.equal(validateDecisionInput({ decision: "rejected", reason: "abc" }).ok, false);
  assert.equal(validateDecisionInput({ decision: "diproses", reason: "", validityMonths: 12 }).ok, false);
  assert.equal(validateDecisionInput({ decision: "verified", reason: "", validityMonths: 0 }).ok, false);
  assert.equal(validateDecisionInput({ decision: "verified", reason: "", validityMonths: 61 }).ok, false);
  assert.equal(validateDecisionInput({ decision: "verified", reason: "", validityMonths: 1.5 }).ok, false);

  assert.deepEqual(validateDecisionInput({ decision: "diproses", reason: "" }), {
    ok: true,
    decision: "diproses",
    reason: "",
  });
  assert.deepEqual(validateDecisionInput({ decision: "verified", reason: " Valid ", validityMonths: 12 }), {
    ok: true,
    decision: "verified",
    reason: "Valid",
    validityMonths: 12,
  });
});

test("memvalidasi perpanjangan masa berlaku dan pencabutan kartu", () => {
  assert.equal(validateRenewInput({ validityMonths: 0, reason: "" }).ok, false);
  assert.equal(validateRenewInput({ validityMonths: 61, reason: "" }).ok, false);
  assert.equal(validateRenewInput({ validityMonths: 12.5, reason: "" }).ok, false);
  assert.equal(validateRenewInput({ validityMonths: 12, reason: "a".repeat(501) }).ok, false);
  assert.deepEqual(validateRenewInput({ validityMonths: 12, reason: " Perpanjangan rutin " }), {
    ok: true,
    validityMonths: 12,
    reason: "Perpanjangan rutin",
  });

  assert.equal(validateRevokeInput({ reason: "abcd", confirm: true }).ok, false);
  assert.equal(validateRevokeInput({ reason: "Alasan sah", confirm: false }).ok, false);
  assert.deepEqual(validateRevokeInput({ reason: " Dokumen tidak valid ", confirm: true }), {
    ok: true,
    reason: "Dokumen tidak valid",
  });
});
