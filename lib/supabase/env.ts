/**
 * The public Supabase settings. Next only inlines NEXT_PUBLIC_ variables into browser code when
 * they are written out literally, so each one is referenced by name here. Plain checks, not a
 * schema library, so this stays out of the browser bundle's weight.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const problems: string[] = [];
  if (!url || !URL.canParse(url)) problems.push("NEXT_PUBLIC_SUPABASE_URL must be a URL");
  if (!anonKey || anonKey.length < 20) problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or too short");
  if (problems.length > 0 || !url || !anonKey) {
    throw new Error(`Supabase is not configured: ${problems.join("; ")}. Fill in .env.local.`);
  }
  return { url, anonKey };
}
