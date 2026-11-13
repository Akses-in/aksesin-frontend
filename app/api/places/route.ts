import type { NextRequest } from "next/server";

const bboxPattern = /^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/;
const statuses = new Set(["accessible", "partial", "unknown"]);

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

// Perantara ke backend supaya browser tidak perlu mengakses Express langsung (tanpa ubah CORS).
// Data tempat bersifat publik, jadi tidak ada token yang diteruskan.
export async function GET(request: NextRequest) {
  const bbox = request.nextUrl.searchParams.get("bbox") ?? "";
  const status = request.nextUrl.searchParams.get("status") ?? "";
  if (!bboxPattern.test(bbox) || (status && !statuses.has(status))) {
    return errorResponse(400, "VALIDATION_ERROR", "Area peta tidak valid.");
  }

  const query = new URLSearchParams({ bbox, limit: "500" });
  if (status) query.set("status", status);
  const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";

  try {
    const response = await fetch(new URL(`/api/places?${query}`, backend), {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.data) {
      return errorResponse(response.ok ? 502 : response.status, body?.error?.code ?? "PLACES_UNAVAILABLE",
        body?.error?.message ?? "Data tempat belum bisa dimuat.");
    }
    return Response.json(body, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return errorResponse(502, "BACKEND_UNAVAILABLE", "Data tempat belum bisa dimuat. Coba lagi beberapa saat lagi.");
  }
}
