import { cardBackendRequest } from "@/lib/digital-card";
import { isUuid } from "@/lib/place";
import { adminAccessToken } from "../../../_impor-osm/backend";

const qrHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(
  _request: Request,
  { params }: RouteContext<"/admin/kartu-digital/[id]/qr">,
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return new Response("QR kartu tidak tersedia.", { status: 404, headers: qrHeaders });
  }

  const token = await adminAccessToken();
  if (!token) {
    return new Response("Sesi admin berakhir.", { status: 401, headers: qrHeaders });
  }

  const response = await cardBackendRequest(`/api/card-applications/${id}/qr`, token);
  if (!response?.ok) {
    return new Response("QR kartu belum dapat dimuat.", { status: response?.status ?? 502, headers: qrHeaders });
  }

  return new Response(response.body, {
    headers: {
      ...qrHeaders,
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
