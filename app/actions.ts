"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { validatePreferenceInput } from "@/lib/preferences";
import { appOrigin, serverSupabase, verifiedAccount } from "@/lib/supabase";
import { loginEmail, newPasswordError } from "@/lib/credentials";
import { clearPendingChallenge, normalizePhone, pendingChallenge, setPendingChallenge, whatsappRequest } from "@/lib/whatsapp-otp";

export async function register(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const email = loginEmail(form.get("email"));
  const password = String(form.get("password") ?? "");
  if (!name || name.length > 100) return "Masukkan nama lengkap hingga 100 karakter.";
  if (!email) return "Masukkan alamat email yang valid.";
  const invalid = newPasswordError(password, form.get("confirmation"));
  if (invalid) return invalid;

  const supabase = await serverSupabase(true);
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name }, emailRedirectTo: new URL("/auth/callback", appOrigin()).href },
  });
  if (error?.status === 429) return "Tunggu sebentar sebelum mencoba daftar lagi.";
  if (error?.code === "weak_password") return "Gunakan password lain yang lebih sulit ditebak.";
  if (error?.code === "user_already_exists" || error?.code === "email_exists") redirect("/cek-email");
  if (error) return "Pendaftaran belum dapat diproses. Periksa alamat email dan coba lagi.";

  if (data.session && data.user?.email_confirmed_at) redirect("/onboarding");
  redirect("/cek-email");
}

export async function registerWithWhatsApp(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const phone = normalizePhone(String(form.get("identity") ?? ""));
  if (!name || name.length > 100) return "Masukkan nama lengkap hingga 100 karakter.";
  if (!phone) return "Masukkan nomor WhatsApp yang valid, misalnya 081234567890.";

  const response = await whatsappRequest("start", { name, phone });
  if (response?.status === 409) redirect("/masuk?metode=whatsapp&terdaftar=1");
  if (response?.status === 429) return "Tunggu sebelum meminta kode baru.";
  if (!response || response.status === 503) return "Layanan OTP belum siap. Hubungi pengelola Aksesin.";
  if (!response.ok) return "Kode WhatsApp belum dapat dikirim. Coba lagi nanti.";

  const { challengeId } = await response.json();
  await setPendingChallenge(phone, challengeId);
  redirect("/verifikasi-otp");
}

export async function signInWithEmail(form: FormData) {
  const email = loginEmail(form.get("email"));
  const password = form.get("password");
  if (!email || typeof password !== "string" || !password || password.length > 256) {
    return "Masukkan email dan password yang valid.";
  }

  const supabase = await serverSupabase(true);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.status === 429) return "Terlalu banyak percobaan. Coba lagi nanti.";
  if (error?.code === "email_not_confirmed") return "Verifikasi emailmu sebelum masuk.";
  if (error || !data.session || !data.user?.email_confirmed_at) {
    if (data.session) await supabase.auth.signOut({ scope: "local" });
    return error?.status && error.status >= 500
      ? "Layanan masuk sedang tidak tersedia. Coba lagi nanti."
      : "Periksa kembali email dan passwordmu.";
  }

  return finishSignIn(supabase);
}

async function finishSignIn(supabase: Awaited<ReturnType<typeof serverSupabase>>): Promise<never> {
  await clearPendingChallenge("login");
  const { data: preferences } = await supabase.from("accessibility_preferences").select("user_id").maybeSingle();
  redirect(preferences ? "/akun" : "/onboarding");
}

export async function signInWithWhatsApp(form: FormData) {
  const phone = normalizePhone(String(form.get("identity") ?? ""));
  if (!phone) return "Masukkan nomor WhatsApp yang valid, misalnya 081234567890.";

  const response = await whatsappRequest("login/start", { phone });
  if (response?.status === 404) return "Nomor WhatsApp belum terdaftar. Pilih Daftar sekarang untuk membuat akun.";
  if (response?.status === 429) return "Tunggu sebelum meminta kode baru.";
  if (!response?.ok) return "Kode WhatsApp belum dapat dikirim. Coba lagi nanti.";

  const { challengeId } = await response.json();
  await setPendingChallenge(phone, challengeId, undefined, "login");
  redirect("/masuk/verifikasi");
}

export async function verifySignInOtp(form: FormData) {
  const pending = await pendingChallenge("login");
  if (!pending) return "Sesi verifikasi berakhir. Kembali ke halaman masuk.";
  const otp = String(form.get("otp") ?? "").trim();
  if (!/^\d{6}$/.test(otp)) return "Masukkan kode 6 digit dari WhatsApp.";

  const { phone, challengeId } = pending;
  const response = await whatsappRequest("login/verify", { phone, challengeId, otp });
  if (response?.status === 400) return "Kode salah atau kedaluwarsa. Periksa kode atau minta kode baru.";
  if (response?.status === 429) return "Terlalu banyak percobaan. Coba lagi nanti.";
  if (!response?.ok) return "Kode belum dapat diperiksa. Coba lagi.";

  const supabase = await serverSupabase(true);
  const { error } = await supabase.auth.setSession(await response.json());
  if (error) return "Sesi masuk belum dapat dibuat. Minta kode baru.";
  return finishSignIn(supabase);
}

export async function resendSignInOtp() {
  const pending = await pendingChallenge("login");
  if (!pending) return "Sesi verifikasi berakhir. Kembali ke halaman masuk.";
  const { phone, challengeId } = pending;
  const response = await whatsappRequest("login/resend", { phone, challengeId });
  if (response?.status === 429) return "Tunggu sebelum meminta kode baru.";
  if (response?.status === 400) return "Sesi verifikasi berakhir. Kembali ke halaman masuk.";
  if (!response?.ok) return "Kode baru belum dapat dikirim. Coba lagi nanti.";

  await setPendingChallenge(phone, challengeId, undefined, "login");
  redirect("/masuk/verifikasi?kirim=1");
}

export async function verifyWhatsAppOtp(form: FormData) {
  const pending = await pendingChallenge();
  if (!pending) return "Sesi verifikasi berakhir. Kembali ke halaman daftar.";
  if (pending.proof) return finishWhatsAppRegistration({ ...pending, proof: pending.proof });

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
  return finishWhatsAppRegistration({ phone: pending.phone, challengeId: pending.challengeId, proof });
}

export async function completeWhatsAppRegistration() {
  const pending = await pendingChallenge();
  if (!pending?.proof) return "Sesi verifikasi berakhir. Kembali ke halaman daftar.";
  return finishWhatsAppRegistration({ ...pending, proof: pending.proof });
}

async function finishWhatsAppRegistration(pending: { phone: string; challengeId: string; proof: string }) {
  const response = await whatsappRequest("complete", pending);
  if (response?.status === 400) {
    await clearPendingChallenge();
    return "Sesi verifikasi berakhir. Kembali ke halaman daftar.";
  }
  if (response?.status === 409) {
    await clearPendingChallenge();
    redirect("/masuk?metode=whatsapp&terdaftar=1");
  }
  if (!response?.ok) return "Akun belum dapat dibuat. Coba selesaikan pendaftaran lagi.";

  await clearPendingChallenge();
  if (response.status === 204) redirect("/masuk?metode=whatsapp&terdaftar=1");
  const supabase = await serverSupabase(true);
  const { error } = await supabase.auth.setSession(await response.json());
  redirect(error ? "/masuk?metode=whatsapp&terdaftar=1" : "/onboarding");
}

export async function resendWhatsAppOtp() {
  const pending = await pendingChallenge();
  if (!pending) return "Sesi verifikasi berakhir. Kembali ke halaman daftar.";
  if (pending.proof) redirect("/verifikasi-otp");
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
  await clearPendingChallenge("login");
  await clearPendingChallenge("phoneChange");
  redirect("/masuk");
}

export async function savePreferences(form: FormData) {
  const { supabase, user } = await verifiedAccount(true);
  const status = String(form.get("disability_status") ?? "");
  const needs = [...new Set(form.getAll("needs").map(String))];
  const notes = String(form.get("notes") ?? "").trim();

  const invalid = validatePreferenceInput(status, needs, notes);
  if (invalid) return invalid;

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
  revalidatePath("/akun/edit");
  redirect(form.get("context") === "settings" ? "/akun/edit?tersimpan=preferensi" : "/akun?tersimpan=preferensi");
}

export async function clearPreferences() {
  const { supabase, user } = await verifiedAccount(true);
  const { error } = await supabase.from("accessibility_preferences")
    .update({ disability_status: null, needs: [], notes: "", onboarding_skipped: true })
    .eq("user_id", user.id);

  if (error) return "Data aksesibilitas belum dapat dihapus. Coba lagi.";
  revalidatePath("/akun");
  revalidatePath("/akun/edit");
  redirect("/akun/edit?hapus=berhasil");
}

export async function skipPreferences() {
  const { supabase, user } = await verifiedAccount(true);
  const { error } = await supabase.from("accessibility_preferences")
    .upsert({ user_id: user.id, onboarding_skipped: true }, { ignoreDuplicates: true });
  if (error) redirect("/onboarding?lewati=gagal");
  revalidatePath("/akun");
  redirect("/akun");
}
