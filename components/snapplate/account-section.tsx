import { LogoutForm } from "@/components/snapplate/logout-form";
import { getCurrentUser } from "@/lib/auth";

/** The log-out button and who is signed in, at the bottom of Settings. Reads the session, so use inside <Suspense>. */
export async function AccountSection() {
  const user = await getCurrentUser();

  return (
    <section className="flex flex-col items-center gap-3 pt-2">
      <LogoutForm />
      <p className="max-w-full truncate text-xs text-muted-foreground">Signed in as {user.email ?? "unknown account"}</p>
    </section>
  );
}
