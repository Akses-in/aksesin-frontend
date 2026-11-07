import { NextResponse, type NextRequest } from "next/server";
import { supabaseClient } from "./lib/supabase";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = supabaseClient({
    getAll: () => request.cookies.getAll(),
    setAll: (entries) => {
      for (const { name, value } of entries) request.cookies.set(name, value);
      response = NextResponse.next({ request });
      for (const { name, value, options } of entries) response.cookies.set(name, value, options);
    },
  });
  await supabase.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/onboarding", "/akun"] };
