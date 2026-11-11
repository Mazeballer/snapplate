import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";

/**
 * Renders its children only for a signed-in, allowlisted user; otherwise getCurrentUser()
 * redirects. It reads the session cookie, so it must sit inside a <Suspense> boundary.
 */
export async function AuthGate({ children }: { children: ReactNode }) {
  await getCurrentUser();
  return <>{children}</>;
}
