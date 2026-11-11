import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

/** Shows who is signed in and a sign-out button. Reads the session, so use inside <Suspense>. */
export async function AccountSection() {
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
