import { Suspense } from "react";
import { ManualScreen } from "@/components/log/manual-screen";
import { FreshOnVisit } from "@/components/log/fresh-on-visit";
import { LogFallback } from "@/components/log/log-page";
import { AuthGate } from "@/components/snapplate/auth-gate";

export const metadata = { title: "Add manually" };

// Full-screen flow outside the tab bar. Still requires sign-in.
export default function Page() {
  return (
    <Suspense fallback={<LogFallback />}>
      <AuthGate>
        <FreshOnVisit>
          <ManualScreen />
        </FreshOnVisit>
      </AuthGate>
    </Suspense>
  );
}
