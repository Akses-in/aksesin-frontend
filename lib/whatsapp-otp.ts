import { cookies } from "next/headers";
import { appOrigin } from "./supabase";

const pendingCookie = "aksesin-otp-challenge";

export function normalizePhone(input: string) {
  const phone = input.trim().replace(/[\s()-]/g, "");
  const international = phone.startsWith("08")
    ? `+62${phone.slice(1)}`
    : phone.startsWith("628") ? `+${phone}` : phone;
  return /^\+[1-9]\d{7,14}$/.test(international) ? international : null;
}

export async function pendingChallenge() {
  const value = (await cookies()).get(pendingCookie)?.value;
  if (!value) return null;
  const [phone, challengeId, proof] = value.split("|");
  if (!phone || !challengeId || !normalizePhone(phone) || !/^[a-f0-9-]{36}$/.test(challengeId)) return null;
  if (proof && !/^[a-f0-9]{64}$/.test(proof)) return null;
  return { phone, challengeId, proof };
}

export async function setPendingChallenge(phone: string, challengeId: string, proof?: string) {
  const value = proof ? `${phone}|${challengeId}|${proof}` : `${phone}|${challengeId}`;
  (await cookies()).set(pendingCookie, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: appOrigin().startsWith("https:"),
    path: "/",
    maxAge: (proof ? 10 : 15) * 60,
  });
}

export async function clearPendingChallenge() {
  (await cookies()).delete(pendingCookie);
}

export async function whatsappRequest(action: "start" | "verify" | "complete" | "resend" | "login", input: object) {
  const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";
  try {
    return await fetch(new URL(`/api/auth/whatsapp/${action}`, backend), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return null;
  }
}
