import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Sign out. POST only, so a link or image on another site cannot trigger it. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // 303 turns the POST into a GET of the login page.
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
