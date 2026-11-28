import { cardBackendRequest } from "@/lib/digital-card";
import { verifiedAccount } from "@/lib/supabase";

const uuidPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

export async function GET(
  _request: Request,
  { params }: RouteContext<"/kartu-aksesibilitas/qr/[cardId]">,
) {
  const { cardId } = await params;
  if (!uuidPattern.test(cardId)) {
    return new Response("QR kartu tidak tersedia.", { status: 404 });
  }

  const { supabase } = await verifiedAccount();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return new Response("Sesi berakhir.", { status: 401 });
  }

  const response = await cardBackendRequest(`/api/card-applications/${cardId}/qr`, session.access_token);
  if (!response?.ok) {
    return new Response("QR kartu belum dapat dimuat.", { status: response?.status ?? 502 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
