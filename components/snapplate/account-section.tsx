import { FlaskConical, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { MOCK_MODE } from "@/lib/mock";

/** Shows who is signed in and a sign-out button. Reads the session, so use inside <Suspense>. */
export async function AccountSection() {
  if (MOCK_MODE) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
        <div className="flex items-start gap-3 rounded-2xl bg-warning/20 p-4 text-sm">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Preview mode is on, so there is no sign-in and the app shows sample data. Remove{" "}
            <code className="rounded bg-background px-1 py-0.5 text-xs">NEXT_PUBLIC_MOCK</code> from your
            environment to use your real account.
          </p>
        </div>
      </section>
    );
  }

  const user = await getCurrentUser();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">Account</h2>
      <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Signed in as</span>
          <span className="break-all font-medium">{user.email ?? "Unknown account"}</span>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline" size="lg" className="w-full gap-2">
            <LogOut aria-hidden />
            Sign out
          </Button>
        </form>
      </div>
    </section>
  );
}
