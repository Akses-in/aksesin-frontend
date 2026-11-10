import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export function appOrigin() {
  if (!process.env.APP_ORIGIN) throw new Error("APP_ORIGIN belum dikonfigurasi.");
  const url = new URL(process.env.APP_ORIGIN);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("APP_ORIGIN harus menggunakan HTTPS di luar localhost.");
  }
  return url.origin;
}

type SessionScope = "account" | "admin";

export function supabaseClient(cookieMethods: CookieMethodsServer, scope: SessionScope = "account") {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith("sb_publishable_")) {
    throw new Error("Konfigurasi Supabase Auth belum lengkap.");
  }

  return createServerClient(url, key, {
    cookies: cookieMethods,
    cookieOptions: {
      ...(scope === "admin" ? { name: "aksesin-admin-auth", path: "/admin" } : { path: "/" }),
      httpOnly: true,
      secure: appOrigin().startsWith("https:"),
      sameSite: "lax",
    },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export async function serverSupabase(writable = false, scope: SessionScope = "account") {
  await connection();
  const jar = await cookies();
  return supabaseClient({
    getAll: () => jar.getAll(),
    setAll: (entries) => {
      if (writable) {
        for (const { name, value, options } of entries) jar.set(name, value, options);
      }
    },
  }, scope);
}

export async function verifiedAccount(writable = false) {
  const supabase = await serverSupabase(writable);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at && !user?.phone_confirmed_at) redirect("/masuk");
  return { supabase, user };
}

export function accountName(user: { user_metadata: Record<string, unknown> }) {
  const name = user.user_metadata.full_name;
  return typeof name === "string" ? name.trim().slice(0, 100) : "";
}
