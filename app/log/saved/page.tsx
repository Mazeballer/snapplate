import { Suspense } from "react";
import { SavedScreen } from "@/components/log/saved-screen";
import { LogFallback } from "@/components/log/log-page";
import { AuthGate } from "@/components/snapplate/auth-gate";

export const metadata = { title: "Saved meals" };

// Full-screen flow outside the tab bar. Still requires sign-in.
export default function Page() {
  return (
    <Suspense fallback={<LogFallback />}>
      <AuthGate>
        <SavedScreen />
      </AuthGate>
    </Suspense>
  );
}
