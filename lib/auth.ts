import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
}

/**
 * The signed-in, allowlisted user, or a redirect.
 *
 * - Not signed in: send to /login.
 * - Signed in but their email is no longer on the allowlist: sign them out and say why.
 * - The access check itself failed: show a retry message instead of guessing.
 *
 * Call this from inside a <Suspense> boundary (it reads the session cookie at request time).
 * Row-level security re-checks the allowlist for every database read and write, so this is the
 * friendly layer, not the only one.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const { data: allowed, error } = await supabase.rpc("is_allowed");
  if (error) redirect("/login?error=setup");
  if (allowed !== true) redirect("/auth/denied");

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  };
});
