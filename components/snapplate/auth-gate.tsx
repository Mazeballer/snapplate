import type { ReactNode } from "react";
import { PersistedCache } from "@/components/snapplate/persisted-cache";
import { getCurrentUser } from "@/lib/auth";

/**
 * Renders its children only for a signed-in, allowlisted user; otherwise getCurrentUser()
 * redirects. It reads the session cookie, so it must sit inside a <Suspense> boundary. The
 * children share a saved copy of this person's data on the device.
 */
export async function AuthGate({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return <PersistedCache userId={user.id}>{children}</PersistedCache>;
}
