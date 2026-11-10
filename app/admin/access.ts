import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase";

export function hasAdminAccess(user: User | null) {
  return Boolean(user?.email_confirmed_at && user.app_metadata?.role === "admin");
}

export async function adminSession(writable = false) {
  const supabase = await serverSupabase(writable, "admin");
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, admin: !error && hasAdminAccess(user) ? user : null };
}

export async function requireAdmin(writable = false) {
  const session = await adminSession(writable);
  if (!session.admin) redirect("/admin/masuk");
  return session;
}
