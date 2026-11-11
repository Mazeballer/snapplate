/**
 * The first-run setup: which questions to ask, in what order, and how the answers become a plan.
 * Pure logic with no screens, so it can be tested. The order follows the reference app, minus the
 * questions that only gather marketing data.
 */
import {
  defaultGoalWeightKg,
  defaultPaceFor,
  profileFromPlanInput,
  type PlanInput,
} from "./plan";
import type { ActivityLevel, DietPlan, Goal, Sex } from "./nutrition";
import { ageOn, type LogDate } from "./time";
import type { Profile, Units } from "./types";

export type StepId =
  | "sex"
  | "activity"
  | "height"
  | "weight"
  | "birthday"
  | "goal"
  | "goalWeight"
  | "pace"
  | "dietPlan"
  | "dietary"
  | "allergies"
  | "burned"
  | "rollover"
  | "building"
  | "plan";

export interface Draft {
  sex: Sex | null;
  activity: ActivityLevel | null;
  units: Units;
  heightCm: number;
  weightKg: number;
  dateOfBirth: LogDate;
  goal: Goal | null;
  goalWeightKg: number | null;
  paceKgPerWeek: number;
  dietPlan: DietPlan;
  dietary: string | null;
  restrictions: string[];
  addBurned: boolean | null;
  rollover: boolean | null;
}

export const MIN_AGE = 13;

export const DEFAULT_DRAFT: Draft = {
  sex: null,
  activity: null,
  units: "metric",
  heightCm: 167,
  weightKg: 70,
  dateOfBirth: "2000-01-01",
  goal: null,
  goalWeightKg: null,
  paceKgPerWeek: 0.8,
  dietPlan: "balanced",
  dietary: null,
  restrictions: [],
  addBurned: null,
  rollover: null,
};

/** The questions to ask. Choosing "maintain" skips the goal weight and the pace. */
export function stepsFor(goal: Goal | null): StepId[] {
  const aim: StepId[] = goal === "lose" || goal === "gain" ? ["goalWeight", "pace"] : [];
  return [
    "sex",
    "activity",
    "height",
    "weight",
    "birthday",
    "goal",
    ...aim,
    "dietPlan",
    "dietary",
    "allergies",
    "burned",
    "rollover",
    "building",
    "plan",
  ];
}

/** Whether the person has answered enough on this step to move on. */
export function canContinue(step: StepId, draft: Draft, today: LogDate): boolean {
  switch (step) {
    case "sex":
      return draft.sex !== null;
    case "activity":
      return draft.activity !== null;
    case "birthday":
      return ageOn(draft.dateOfBirth, today) >= MIN_AGE;
    case "goal":
      return draft.goal !== null;
    case "burned":
      return draft.addBurned !== null;
    case "rollover":
      return draft.rollover !== null;
    default:
      return true;
  }
}

/** Choose a goal and reset the answers that depend on it. */
export function withGoal(draft: Draft, goal: Goal): Draft {
  return {
    ...draft,
    goal,
    goalWeightKg: defaultGoalWeightKg(goal, draft.weightKg, draft.heightCm),
    paceKgPerWeek: defaultPaceFor(goal) || draft.paceKgPerWeek,
  };
}

/** The plan input for the answers so far, or null while required answers are missing. */
export function draftToPlanInput(draft: Draft): PlanInput | null {
  if (!draft.sex || !draft.activity || !draft.goal) return null;
  const maintain = draft.goal === "maintain";
  return {
    sex: draft.sex,
    dateOfBirth: draft.dateOfBirth,
    heightCm: draft.heightCm,
    weightKg: draft.weightKg,
    activityLevel: draft.activity,
    goal: draft.goal,
    goalWeightKg: maintain ? draft.weightKg : (draft.goalWeightKg ?? defaultGoalWeightKg(draft.goal, draft.weightKg, draft.heightCm)),
    paceKgPerWeek: maintain ? 0 : draft.paceKgPerWeek,
    dietPlan: draft.dietPlan,
  };
}

/** The profile to save when onboarding finishes. */
export function draftToProfile(draft: Draft, today: LogDate): Profile | null {
  const input = draftToPlanInput(draft);
  if (!input) return null;
  return profileFromPlanInput(
    input,
    {
      units: draft.units,
      restrictions: draft.restrictions,
      dietaryPreference: draft.dietary,
      addBurnedCalories: draft.addBurned ?? false,
      rolloverCalories: draft.rollover ?? false,
    },
    today,
  );
}

/** A complete draft for jumping straight to a later screen while previewing. */
export function previewDraft(): Draft {
  return withGoal({ ...DEFAULT_DRAFT, sex: "male", activity: "moderate", addBurned: false, rollover: false }, "lose");
}
