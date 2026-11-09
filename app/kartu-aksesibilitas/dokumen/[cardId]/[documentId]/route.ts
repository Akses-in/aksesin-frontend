import { cardBackendRequest } from "@/lib/digital-card";
import { verifiedAccount } from "@/lib/supabase";

const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const previewHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};

export async function GET(
  _request: Request,
  { params }: RouteContext<"/kartu-aksesibilitas/dokumen/[cardId]/[documentId]">,
) {
  const { cardId, documentId } = await params;
  if (!uuidPattern.test(cardId) || !uuidPattern.test(documentId)) {
    return new Response("Dokumen tidak tersedia.", { status: 404, headers: previewHeaders });
  }

  const { supabase } = await verifiedAccount();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return new Response("Sesi berakhir. Silakan masuk kembali.", { status: 401, headers: previewHeaders });
  }

  const response = await cardBackendRequest(
    `/api/card-applications/${cardId}/documents/${documentId}`,
    session.access_token,
  );
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
