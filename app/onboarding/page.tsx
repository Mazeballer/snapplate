import { Suspense } from "react";
import { OnboardingFlow } from "@/components/onboarding/flow";
import { AuthGate } from "@/components/snapplate/auth-gate";

export const metadata = { title: "Set up your plan" };

// Outside the tab-bar layout: setup is a full-screen flow. It still requires sign-in.
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
      <AuthGate>
        <OnboardingFlow />
      </AuthGate>
    </Suspense>
  );
}
