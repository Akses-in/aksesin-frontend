import { cardBackendRequest } from "@/lib/digital-card";
import { isUuid } from "@/lib/place";
import { adminAccessToken } from "../../../../_impor-osm/backend";

const previewHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};

export async function GET(
  _request: Request,
  { params }: RouteContext<"/admin/kartu-digital/[id]/dokumen/[documentId]">,
) {
  const { id, documentId } = await params;
  if (!isUuid(id) || !isUuid(documentId)) {
    return new Response("Dokumen tidak tersedia.", { status: 404, headers: previewHeaders });
  }

  const token = await adminAccessToken();
  if (!token) {
    return new Response("Sesi admin berakhir. Silakan masuk kembali.", { status: 401, headers: previewHeaders });
  }

  const response = await cardBackendRequest(`/api/admin/card-applications/${id}/documents/${documentId}`, token);
  if (response?.status === 404) {
    return new Response("Dokumen tidak tersedia.", { status: 404, headers: previewHeaders });
  }
  if (!response?.ok) {
    return new Response("Dokumen belum dapat dibuka. Coba lagi nanti.", { status: 502, headers: previewHeaders });
  }

  return new Response(response.body, {
    headers: {
      ...previewHeaders,
      "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": "inline",
    },
  });
}
