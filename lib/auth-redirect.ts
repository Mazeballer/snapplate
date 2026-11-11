/** Pure helpers for the sign-in redirects. */

export type LoginError = "not_allowed" | "cancelled" | "failed" | "setup";

export const LOGIN_ERROR_MESSAGES: Record<LoginError, string> = {
  not_allowed:
    "This Google account hasn't been given access. Snapplate is private. Ask the owner to add your email.",
  cancelled: "Sign-in was cancelled.",
  failed: "Sign-in didn't work. Please try again.",
  setup: "We couldn't check your access just now. Please try again in a moment.",
};

export function isLoginError(value: string | null | undefined): value is LoginError {
  return value !== null && value !== undefined && value in LOGIN_ERROR_MESSAGES;
}

/** Only allow redirects to a path inside this app, never to another site. */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/**
 * Turns whatever the OAuth provider or Supabase sent back to the callback into one of our
 * login messages. The allowlist hook rejects with a message mentioning "private app".
 */
export function loginErrorFromOAuth(error: string | null, description: string | null): LoginError {
  const text = `${error ?? ""} ${description ?? ""}`.toLowerCase();
  if (/private app|not been given access|not allowed/.test(text)) {
    return "not_allowed";
  }
  if (/access_denied|cancel/.test(text)) return "cancelled";
  return "failed";
}
