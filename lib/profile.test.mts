import assert from "node:assert/strict";
import { test } from "node:test";
import { canCancelCardStatus, canEditCardStatus, cardStatuses } from "./digital-card.ts";
import { isUuid } from "./place.ts";
import { validatePreferenceInput, type Preferences } from "./preferences.ts";
import {
  accountIdentity,
  disabilityLabel,
  hasAccessibilityProfile,
  needLabels,
  onboardingStatus,
} from "./profile.ts";

function preferences(overrides: Partial<Preferences> = {}): Preferences {
  return {
    disability_status: null,
    needs: [],
    notes: "",
    onboarding_skipped: false,
    ...overrides,
  };
}

test("menolak status disabilitas yang tidak ada di daftar", () => {
  assert.equal(
    validatePreferenceInput("penyandang", [], ""),
    "Pilih status disabilitas yang tersedia.",
  );
});

test("menolak kebutuhan yang tidak ada di daftar", () => {
  assert.equal(
    validatePreferenceInput("disabled", ["audio", "lift"], ""),
    "Pilih kebutuhan aksesibilitas yang tersedia.",
  );
});

test("menolak catatan lebih dari 300 karakter", () => {
  assert.equal(
    validatePreferenceInput("", [], "a".repeat(301)),
    "Batasi deskripsi hingga 300 karakter.",
  );
});

test("menerima isian kosong dan isian yang valid", () => {
  assert.equal(validatePreferenceInput("", [], ""), "");
  assert.equal(validatePreferenceInput("undisclosed", ["audio", "step_free"], "Pakai kursi roda."), "");
});

test("hanya status pending dan perbaikan yang boleh diubah", () => {
  assert.deepEqual(cardStatuses.filter(canEditCardStatus), ["pending", "perbaikan"]);
});

test("hanya status yang belum selesai yang boleh dibatalkan", () => {
  assert.deepEqual(cardStatuses.filter(canCancelCardStatus), ["pending", "diproses", "perbaikan"]);
});

test("menolak id yang bukan UUID", () => {
  for (const value of ["", "1", "abc", "../../etc/passwd", "3f2504e0-4f89-11d3-9a0c"]) {
    assert.equal(isUuid(value), false, value);
  }
});

test("menerima UUID baris milik sendiri", () => {
  assert.equal(isUuid("3f2504e0-4f89-11d3-9a0c-0305e82c3301"), true);
});

test("menerjemahkan opsi yang dikenal dan mengabaikan yang tidak dikenal", () => {
  assert.equal(disabilityLabel("disabled"), "Ya, saya penyandang disabilitas");
  assert.equal(disabilityLabel("tidak_ada"), null);
  assert.deepEqual(needLabels(["audio", "tidak_ada", "step_free"]), ["Akses tanpa tangga", "Panduan audio"]);
});

test("membedakan profil kosong, dilewati, dan terisi", () => {
  assert.equal(hasAccessibilityProfile(null), false);
  assert.equal(onboardingStatus(null), "Belum diisi");
  assert.equal(onboardingStatus(preferences({ onboarding_skipped: true })), "Dilewati");
  assert.equal(onboardingStatus(preferences()), "Selesai");
  assert.equal(hasAccessibilityProfile(preferences({ notes: "Butuh pendamping" })), true);
});

test("memakai nomor WhatsApp hanya setelah terverifikasi", () => {
  assert.deepEqual(accountIdentity({ email: "a@contoh.id" }), { label: "Email", value: "a@contoh.id" });
  assert.deepEqual(
    accountIdentity({ email: "a@contoh.id", phone: "+6281234567890", phone_confirmed_at: null }),
    { label: "Email", value: "a@contoh.id" },
  );
  assert.deepEqual(
    accountIdentity({ email: "a@contoh.id", phone: "+6281234567890", phone_confirmed_at: "2026-11-09T00:00:00Z" }),
    { label: "Nomor WhatsApp", value: "+6281234567890" },
  );
});
