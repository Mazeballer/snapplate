"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { OnboardingShell } from "@/components/onboarding/shell";
import {
  ActivityStep,
  AllergiesStep,
  BirthdayStep,
  BuildingStep,
  BurnedStep,
  DietaryStep,
  DietPlanStep,
  GoalStep,
  GoalWeightStep,
  HeightStep,
  PaceStep,
  PlanStep,
  RolloverStep,
  SexStep,
  WeightStep,
} from "@/components/onboarding/steps";
import { useSaveProfile } from "@/hooks/use-data";
import { useToday } from "@/hooks/use-today";
import { MOCK_MODE } from "@/lib/mock";
import {
  canContinue,
  DEFAULT_DRAFT,
  draftToProfile,
  previewDraft,
  stepsFor,
  withGoal,
  type Draft,
  type StepId,
} from "@/lib/onboarding";
import type { Goal } from "@/lib/nutrition";
import type { Profile } from "@/lib/types";

const KNOWN_STEPS = new Set<string>(stepsFor("lose"));

export function OnboardingFlow() {
  const router = useRouter();
  const today = useToday();
  const save = useSaveProfile();

  // Preview mode can jump straight to a screen with ?step=pace, to look at it without clicking through.
  const jump = useSearchParams().get("step");
  const jumpTo = MOCK_MODE && jump && KNOWN_STEPS.has(jump) ? (jump as StepId) : null;

  const [draft, setDraft] = useState<Draft>(() => (jumpTo ? previewDraft() : DEFAULT_DRAFT));
  const [stepId, setStepId] = useState<StepId>(jumpTo ?? "sex");
  // Targets the person typed on the plan screen; cleared whenever an earlier answer changes.
  const [edited, setEdited] = useState<Profile | null>(null);

  const steps = stepsFor(draft.goal);
  const index = Math.max(0, steps.indexOf(stepId));

  const update = useCallback((patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setEdited(null);
  }, []);

  const pickGoal = (goal: Goal) => {
    setDraft((d) => withGoal(d, goal));
    setEdited(null);
  };

  const calculated = useMemo(() => (today ? draftToProfile(draft, today) : null), [draft, today]);
  const profile = edited ?? calculated;

  const goNext = useCallback(() => {
    const list = stepsFor(draft.goal);
    const next = list[Math.min(list.length - 1, list.indexOf(stepId) + 1)];
    if (next) setStepId(next);
  }, [draft.goal, stepId]);

  function goBack() {
    let prev = steps[index - 1];
    // The "building your plan" screen is only a pause; going back skips over it.
    if (prev === "building") prev = steps[index - 2];
    if (prev) setStepId(prev);
  }

  function finish() {
    if (!profile || !today) return;
    save.mutate(
      {
        profile,
        weightLog: profile.weightKg !== null ? { logDate: today, weightKg: profile.weightKg } : undefined,
        markOnboarded: true,
      },
      {
        onSuccess: () => router.replace("/"),
        onError: () => toast.error("Couldn't save your plan. Please try again."),
      },
    );
  }

  if (!today) {
    return <div className="min-h-dvh" aria-busy="true" />;
  }

  const isBuilding = stepId === "building";
  const isPlan = stepId === "plan";
  const stepProps = { draft, update };

  return (
    <OnboardingShell
      progress={index / (steps.length - 1)}
      onBack={goBack}
      canGoBack={index > 0 && !isBuilding}
      hideFooter={isBuilding}
      onContinue={isPlan ? finish : goNext}
      continueLabel={isPlan ? "Let's get started" : "Continue"}
      continueDisabled={isPlan ? !profile : !canContinue(stepId, draft, today)}
      continuePending={save.isPending}
    >
      {stepId === "sex" ? <SexStep {...stepProps} /> : null}
      {stepId === "activity" ? <ActivityStep {...stepProps} /> : null}
      {stepId === "height" ? <HeightStep {...stepProps} /> : null}
      {stepId === "weight" ? <WeightStep {...stepProps} /> : null}
      {stepId === "birthday" ? <BirthdayStep {...stepProps} today={today} /> : null}
      {stepId === "goal" ? <GoalStep draft={draft} onPick={pickGoal} /> : null}
      {stepId === "goalWeight" ? <GoalWeightStep {...stepProps} /> : null}
      {stepId === "pace" ? <PaceStep {...stepProps} today={today} /> : null}
      {stepId === "dietPlan" ? <DietPlanStep {...stepProps} /> : null}
      {stepId === "dietary" ? <DietaryStep {...stepProps} /> : null}
      {stepId === "allergies" ? <AllergiesStep {...stepProps} /> : null}
      {stepId === "burned" ? <BurnedStep {...stepProps} /> : null}
      {stepId === "rollover" ? <RolloverStep {...stepProps} /> : null}
      {isBuilding ? <BuildingStep onDone={goNext} /> : null}
      {isPlan && profile ? <PlanStep profile={profile} today={today} onEdit={setEdited} /> : null}
    </OnboardingShell>
  );
}
