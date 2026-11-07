"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifiedAccount } from "@/lib/supabase";
import {
  clearPendingChallenge, normalizePhone, pendingChallenge, setPendingChallenge, whatsappRequest,
} from "@/lib/whatsapp-otp";

async function accountAccessToken() {
  const { supabase } = await verifiedAccount(true);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) redirect("/masuk");
  return session.access_token;
}

export async function updateAccountName(form: FormData) {
  const { supabase } = await verifiedAccount(true);
  const value = form.get("name");
  const name = typeof value === "string" ? value.trim() : "";
  if (!name || name.length > 100) return "Masukkan nama lengkap hingga 100 karakter.";

  const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
  if (error) return "Nama belum dapat disimpan. Coba lagi.";

  revalidatePath("/akun");
  redirect("/akun?tersimpan=nama");
}

export async function startPhoneChange(form: FormData) {
  const accessToken = await accountAccessToken();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  if (!phone) return "Masukkan nomor WhatsApp yang valid, misalnya 081234567890.";

  const response = await whatsappRequest("change/start", { phone }, accessToken);
  if (response?.status === 401) redirect("/masuk");
  if (response?.status === 422) return "Nomor ini sudah terdaftar di akunmu.";
  if (response?.status === 429) return "Tunggu sebelum meminta kode baru.";
  if (!response?.ok) return "Kode WhatsApp belum dapat dikirim. Coba lagi.";

  const { challengeId } = await response.json();
  await setPendingChallenge(phone, challengeId, undefined, "phoneChange");
  redirect("/akun/verifikasi-nomor");
}

export async function resendPhoneChangeOtp() {
  const accessToken = await accountAccessToken();
  const pending = await pendingChallenge("phoneChange");
  if (!pending) return "Sesi verifikasi berakhir. Kembali ke halaman edit akun.";

  const { phone, challengeId } = pending;
  const response = await whatsappRequest("change/resend", { phone, challengeId }, accessToken);
  if (response?.status === 401) redirect("/masuk");
  if (response?.status === 400) return "Sesi verifikasi berakhir. Kembali ke halaman edit akun.";
  if (response?.status === 429) return "Tunggu sebelum meminta kode baru.";
  if (!response?.ok) return "Kode baru belum dapat dikirim. Coba lagi.";

  await setPendingChallenge(phone, challengeId, undefined, "phoneChange");
  redirect("/akun/verifikasi-nomor?kirim=1");
}

export async function verifyPhoneChange(form: FormData) {
  const accessToken = await accountAccessToken();
  const pending = await pendingChallenge("phoneChange");
  if (!pending) return "Sesi verifikasi berakhir. Kembali ke halaman edit akun.";
  const otp = String(form.get("otp") ?? "").trim();
  if (!/^\d{6}$/.test(otp)) return "Masukkan kode 6 digit dari WhatsApp.";

  const { phone, challengeId } = pending;
  const response = await whatsappRequest("change/verify", { phone, challengeId, otp }, accessToken);
  if (response?.status === 401) redirect("/masuk");
  if (response?.status === 400) return "Kode salah atau kedaluwarsa. Periksa kode atau minta kode baru.";
  if (response?.status === 409) return "Nomor ini sudah dipakai akun lain. Gunakan nomor lain.";
  if (!response?.ok) return "Nomor WhatsApp belum dapat diperbarui. Coba lagi.";

  await clearPendingChallenge("phoneChange");
  revalidatePath("/akun");
  redirect("/akun?tersimpan=nomor");
}
