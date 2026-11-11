import { NextResponse, type NextRequest } from "next/server";
import { MOCK_MODE } from "@/lib/mock";
import { updateSession } from "@/lib/supabase/proxy";

// Pages anyone may open without signing in.
const PUBLIC_PREFIXES = ["/login", "/auth", "/privacy"];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  // Mock mode: no accounts, so nothing to check. The login page just goes to the app.
  if (MOCK_MODE) {
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  const { response, signedIn } = await updateSession(request);
  const { pathname, searchParams } = request.nextUrl;

  if (!signedIn && !isPublic(pathname)) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    // Keep any cookies the session refresh just set.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  // Already signed in: skip the login page, unless it is showing an error (that would loop).
  if (signedIn && pathname === "/login" && !searchParams.has("error")) {
    const redirect = NextResponse.redirect(new URL("/", request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static files and the PWA plumbing, which must load without a session:
    // the service worker, the manifest, icons and the offline page.
    "/((?!_next/static|_next/image|serwist|manifest\\.webmanifest|icon\\.png|apple-icon\\.png|icons/|~offline|sw\\.js).*)",
  ],
};
