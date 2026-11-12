import { Suspense } from "react";
import { FoodsScreen } from "@/components/log/foods-screen";
import { LogFallback } from "@/components/log/log-page";
import { AuthGate } from "@/components/snapplate/auth-gate";

export const metadata = { title: "Food Database" };

// Full-screen flow outside the tab bar. Still requires sign-in.
export default function Page() {
  return (
    <Suspense fallback={<LogFallback />}>
      <AuthGate>
        <FoodsScreen />
      </AuthGate>
    </Suspense>
  );
}
