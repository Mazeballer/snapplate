import { Suspense } from "react";
import { ScanScreen } from "@/components/log/scan-screen";
import { FreshOnVisit } from "@/components/log/fresh-on-visit";
import { LogFallback } from "@/components/log/log-page";
import { AuthGate } from "@/components/snapplate/auth-gate";

export const metadata = { title: "Scan food" };

// Full-screen flow outside the tab bar. Still requires sign-in.
export default function Page() {
  return (
    <Suspense fallback={<LogFallback />}>
      <AuthGate>
        <FreshOnVisit>
          <ScanScreen />
        </FreshOnVisit>
      </AuthGate>
    </Suspense>
  );
}
