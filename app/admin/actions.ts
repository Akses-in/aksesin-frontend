"use server";

import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase";
import { hasAdminAccess, requireAdmin } from "./access";

export async function signInAdmin(form: FormData) {
  const emailInput = form.get("email");
  const email = typeof emailInput === "string" ? emailInput.trim() : "";
  const password = form.get("password");
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" || !password || password.length > 256) {
    return "Masukkan email dan password yang valid.";
  }

  const supabase = await serverSupabase(true, "admin");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.status === 429) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  if (error || !data.session || !hasAdminAccess(data.user)) {
    if (data.session) await supabase.auth.signOut({ scope: "local" });
    return "Tidak bisa masuk. Periksa email, password, dan akses admin akunmu.";
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  const { supabase } = await requireAdmin(true);
  const { error } = await supabase.auth.signOut({ scope: "local" });
  redirect(error ? "/admin?keluar=gagal" : "/admin/masuk");
}
