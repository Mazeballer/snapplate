import { NextResponse, type NextRequest } from "next/server";
import { loginErrorFromOAuth, safeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/lib/supabase/server";

/** Where Google (through Supabase) sends the user back after they approve sign-in. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const toLogin = (error: string) =>
    NextResponse.redirect(new URL(`/login?error=${error}`, request.url));

  // The provider or the allowlist hook said no.
  const oauthError = searchParams.get("error");
  if (oauthError) {
    return toLogin(loginErrorFromOAuth(oauthError, searchParams.get("error_description")));
  }

  const code = searchParams.get("code");
  if (!code) return toLogin("failed");

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return toLogin("failed");

  // An account made before the allowlist, or one removed from it since, can still reach here.
  const { data: allowed, error: allowError } = await supabase.rpc("is_allowed");
  if (allowError) {
    await supabase.auth.signOut();
    return toLogin("setup");
  }
  if (allowed !== true) {
    await supabase.auth.signOut();
    return toLogin("not_allowed");
  }

  return NextResponse.redirect(new URL(safeNextPath(searchParams.get("next")), request.url));
}
