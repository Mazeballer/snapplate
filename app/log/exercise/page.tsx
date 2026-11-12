import { Suspense } from "react";
import { ExerciseScreen } from "@/components/log/exercise-screen";
import { LogFallback } from "@/components/log/log-page";
import { AuthGate } from "@/components/snapplate/auth-gate";

export const metadata = { title: "Exercise" };

// Full-screen flow outside the tab bar. Still requires sign-in.
export default function Page() {
  return (
    <Suspense fallback={<LogFallback />}>
      <AuthGate>
        <ExerciseScreen />
      </AuthGate>
    </Suspense>
  );
}
