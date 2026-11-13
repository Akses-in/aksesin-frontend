import { NextResponse, type NextRequest } from "next/server";
import { loginEmail } from "@/lib/credentials";
import { appOrigin, serverSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const accountUpdate = request.nextUrl.searchParams.get("tujuan") === "akun";
  let destination = accountUpdate ? "/akun/edit?email=gagal" : "/masuk?verifikasi=1";
  if (code && code.length <= 256) {
    const supabase = await serverSupabase(true);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    if (!error && data.user?.email_confirmed_at && loginEmail(data.user.email) && !data.user.new_email) {
      destination = accountUpdate ? "/akun/edit?email=terverifikasi" : "/onboarding";
    }
  }

  const response = NextResponse.redirect(new URL(destination, appOrigin()));
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
