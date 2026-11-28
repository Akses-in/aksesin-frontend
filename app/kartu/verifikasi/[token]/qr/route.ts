const tokenPattern = /^[A-Za-z0-9_-]{32,128}$/;

const qrHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(
  _request: Request,
  { params }: RouteContext<"/kartu/verifikasi/[token]/qr">,
) {
  const { token } = await params;
  if (!tokenPattern.test(token)) {
    return new Response("QR kartu tidak valid.", { status: 404, headers: qrHeaders });
  }

  const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";
  try {
    const response = await fetch(new URL(`/api/cards/verify/${encodeURIComponent(token)}/qr`, backend), {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 404) {
      return new Response("QR kartu tidak ditemukan.", { status: 404, headers: qrHeaders });
    }
    if (!response.ok) {
      return new Response("QR kartu belum dapat dimuat.", { status: 502, headers: qrHeaders });
    }

    return new Response(response.body, {
      headers: {
        ...qrHeaders,
        "Content-Type": "image/svg+xml; charset=utf-8",
      },
    });
  } catch {
    return new Response("Server verifikasi belum dapat dihubungi.", { status: 502, headers: qrHeaders });
  }
}
