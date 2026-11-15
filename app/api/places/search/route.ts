import type { NextRequest } from "next/server";

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return errorResponse(400, "VALIDATION_ERROR", "Kata kunci pencarian tidak boleh kosong.");
  }

  const limit = request.nextUrl.searchParams.get("limit") ?? "20";
  const query = new URLSearchParams({ q, limit });
  const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";

  try {
    const response = await fetch(new URL(`/api/places/search?${query}`, backend), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.data) {
      return errorResponse(
        response.ok ? 502 : response.status,
        body?.error?.code ?? "SEARCH_UNAVAILABLE",
        body?.error?.message ?? "Pencarian tempat gagal.",
      );
    }
    return Response.json(body, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch {
    return errorResponse(502, "BACKEND_UNAVAILABLE", "Layanan pencarian belum bisa diakses.");
  }
}
