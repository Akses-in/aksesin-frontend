"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { accessibilityOptions, disabilityOptions } from "@/lib/preferences";
import { serverSupabase, verifiedAccount } from "@/lib/supabase";
import { clearPendingChallenge, normalizePhone, pendingChallenge, setPendingChallenge, whatsappRequest } from "@/lib/whatsapp-otp";

function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function register(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const phone = normalizePhone(String(form.get("identity") ?? ""));
  if (!name || name.length > 100) return "Masukkan nama lengkap hingga 100 karakter.";
  if (!phone) return "Masukkan nomor WhatsApp yang valid, misalnya 081234567890.";

  const response = await whatsappRequest("start", { name, phone });
  if (response?.status === 429) return "Tunggu sebelum meminta kode baru.";
  if (!response || response.status === 503) return "Layanan OTP belum siap. Hubungi pengelola Aksesin.";
  if (!response.ok) return "Kode WhatsApp belum dapat dikirim. Coba lagi nanti.";

  const { challengeId } = await response.json();
  await setPendingChallenge(phone, challengeId);
  redirect("/verifikasi-otp");
}

export async function signIn(form: FormData) {
  const identity = String(form.get("identity") ?? "").trim();
  const phone = normalizePhone(identity);
  const password = String(form.get("password") ?? "");
  if ((!phone && !validEmail(identity)) || !password || password.length > 256) {
    return "Masukkan nomor WhatsApp atau email dan password.";
  }

  const supabase = await serverSupabase(true);
  if (phone) {
    const response = await whatsappRequest("login", { phone, password });
    if (response?.status === 429) return "Terlalu banyak percobaan. Coba lagi nanti.";
    if (!response || response.status >= 500) return "Layanan masuk lewat WhatsApp sedang tidak tersedia.";
    if (!response.ok) return "Periksa nomor WhatsApp dan password akunmu.";
    const { error } = await supabase.auth.setSession(await response.json());
    if (error) return "Sesi masuk belum dapat dibuat. Coba lagi.";
  } else {
    const { data, error } = await supabase.auth.signInWithPassword({ email: identity, password });
    if (error?.status === 429) return "Terlalu banyak percobaan. Coba lagi nanti.";
    if (!data.user?.email_confirmed_at) {
      if (data.session) await supabase.auth.signOut({ scope: "local" });
      return "Periksa email, password, dan status verifikasi akunmu.";
    }
  }

  const { data: preferences } = await supabase.from("accessibility_preferences").select("user_id").maybeSingle();
  redirect(preferences ? "/akun" : "/onboarding");
}

export async function verifyWhatsAppOtp(form: FormData) {
  const pending = await pendingChallenge();
  if (!pending) return "Sesi verifikasi berakhir. Kembali ke halaman daftar.";
  if (pending.proof) redirect("/buat-password");

  const otp = String(form.get("otp") ?? "").trim();
  if (!/^\d{6}$/.test(otp)) return "Masukkan kode 6 digit dari WhatsApp.";

  const response = await whatsappRequest("verify", { phone: pending.phone, challengeId: pending.challengeId, otp });
  if (response?.status === 400) return "Kode salah atau kedaluwarsa. Periksa kode atau minta kode baru.";
  if (!response?.ok) return "Kode belum dapat diperiksa. Coba lagi.";

  const { proof } = await response.json();
  if (typeof proof !== "string" || !/^[a-f0-9]{64}$/.test(proof)) {
    return "Kode belum dapat diperiksa. Coba lagi.";
  }
  await setPendingChallenge(pending.phone, pending.challengeId, proof);
  redirect("/buat-password");
}

export async function completeWhatsAppRegistration(form: FormData) {
  const pending = await pendingChallenge();
  if (!pending?.proof) return "Sesi verifikasi berakhir. Kembali ke halaman daftar.";

  const password = String(form.get("password") ?? "");
  if (password.length < 8 || new TextEncoder().encode(password).length > 72 ||
    !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Gunakan minimal 8 karakter, dengan huruf besar, huruf kecil, dan angka. Panjang maksimum 72 byte.";
  }
  if (password !== form.get("confirmation")) return "Konfirmasi password belum sama.";

  const response = await whatsappRequest("complete", { ...pending, password });
  if (response?.status === 400) return "Sesi verifikasi berakhir. Kembali ke halaman daftar.";
  if (response?.status === 409) return "Jika nomor ini sudah terdaftar, masuk dengan password akunmu.";
  if (response?.status === 422) return "Gunakan password lain yang lebih sulit ditebak.";
  if (!response?.ok) return "Akun belum dapat dibuat. Coba lagi.";

  await clearPendingChallenge();
  if (response.status === 204) redirect("/masuk");
  const supabase = await serverSupabase(true);
  const { error } = await supabase.auth.setSession(await response.json());
  redirect(error ? "/masuk" : "/onboarding");
}

export async function resendWhatsAppOtp() {
  const pending = await pendingChallenge();
  if (!pending) return "Sesi verifikasi berakhir. Kembali ke halaman daftar.";
  if (pending.proof) redirect("/buat-password");
  const response = await whatsappRequest("resend", { phone: pending.phone, challengeId: pending.challengeId });
  if (response?.status === 429) return "Tunggu sebelum meminta kode baru.";
  if (response?.status === 400) return "Sesi verifikasi berakhir. Kembali ke halaman daftar.";
  if (!response?.ok) return "Kode baru belum dapat dikirim. Coba lagi nanti.";

  await setPendingChallenge(pending.phone, pending.challengeId);
  redirect("/verifikasi-otp?kirim=1");
}

export async function signOut() {
  const supabase = await serverSupabase(true);
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect("/akun?keluar=gagal");
  await clearPendingChallenge("phoneChange");
  redirect("/masuk");
}

export async function savePreferences(form: FormData) {
  const { supabase, user } = await verifiedAccount(true);
  const status = String(form.get("disability_status") ?? "");
  const needs = [...new Set(form.getAll("needs").map(String))];
  const notes = String(form.get("notes") ?? "").trim();

  if ((status && !disabilityOptions.some(([value]) => value === status)) ||
    needs.some((need) => !accessibilityOptions.some(([value]) => value === need)) ||
    Array.from(notes).length > 300) {
    return "Periksa pilihan dan batasi deskripsi hingga 300 karakter.";
  }

  const table = supabase.from("accessibility_preferences");
  const { error } = await table.upsert({
    user_id: user.id,
    disability_status: status || null,
    needs,
    notes,
    onboarding_skipped: !status && !needs.length && !notes,
  });

  if (error) return "Preferensi belum tersimpan. Coba lagi.";
  revalidatePath("/akun");
  redirect("/akun");
}

export async function skipPreferences() {
  const { supabase, user } = await verifiedAccount(true);
  const { error } = await supabase.from("accessibility_preferences")
    .upsert({ user_id: user.id, onboarding_skipped: true }, { ignoreDuplicates: true });
  if (error) redirect("/onboarding?lewati=gagal");
  revalidatePath("/akun");
  redirect("/akun");
}
