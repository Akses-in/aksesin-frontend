import { cardBackendRequest } from "@/lib/digital-card";
import { requireAdmin } from "../access";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

// Token sesi admin hanya dipakai di server Next.js dan tidak pernah dikirim ke browser.
export async function adminAccessToken(writable = false) {
  const { supabase } = await requireAdmin(writable);
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function adminApi<T>(
  path: string,
  token: string | null,
  options?: { method?: string; body?: unknown },
): Promise<ApiResult<T>> {
  if (!token) return { ok: false, status: 401, message: "Sesi admin berakhir. Silakan masuk kembali." };

  const response = await cardBackendRequest(path, token, options);
  if (!response) return { ok: false, status: 0, message: "Server data belum bisa dihubungi. Coba lagi beberapa saat lagi." };

  const body = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { message?: string; details?: { message?: string }[] };
  } | null;
  if (!response.ok || body?.data === undefined) {
    return {
      ok: false,
      status: response.status,
      message: body?.error?.details?.[0]?.message ?? body?.error?.message ?? "Permintaan belum dapat diproses. Coba lagi.",
    };
  }
  return { ok: true, data: body.data };
}
