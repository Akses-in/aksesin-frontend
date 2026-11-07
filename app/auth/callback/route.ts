import { NextResponse, type NextRequest } from "next/server";
import { appOrigin, serverSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  let destination = "/masuk?verifikasi=1";
  if (code && code.length <= 256) {
    const supabase = await serverSupabase(true);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user?.email_confirmed_at) destination = "/onboarding";
  }

  const response = NextResponse.redirect(new URL(destination, appOrigin()));
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
