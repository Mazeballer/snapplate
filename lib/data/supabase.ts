/**
 * The real data source: reads and writes the signed-in user's rows through the browser
 * Supabase client. Row-level security in the database limits every query to that user.
 */
import { createClient } from "@/lib/supabase/client";
import type { LogDate } from "@/lib/time";
import type { DailyActivity, Meal, MealItem, Profile, WeightLog } from "@/lib/types";
import type { DataSource } from "./source";

// Rows come back with snake_case column names. These small shapes name only what is used.
interface MealItemRow {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  position: number;
}

interface MealRow {
  id: string;
  logged_at: string;
  log_date: string;
  meal_type: Meal["mealType"];
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  servings: number;
  health_score: number | null;
  source: Meal["source"];
  meal_items: MealItemRow[] | null;
}

interface ProfileRow {
  display_name: string | null;
  sex: Profile["sex"];
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  units: Profile["units"];
  activity_level: Profile["activityLevel"];
  goal: Profile["goal"];
  goal_weight_kg: number | null;
  pace_kg_per_week: number | null;
  diet_plan: Profile["dietPlan"];
  calorie_target: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  step_goal: number;
  add_burned_calories: boolean;
  onboarded_at: string | null;
}

function fail(action: string, error: { message: string } | null): never {
  throw new Error(`${action}: ${error?.message ?? "unknown error"}`);
}

function toItem(row: MealItemRow): MealItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
  };
}

function toMeal(row: MealRow): Meal {
  return {
    id: row.id,
    loggedAt: row.logged_at,
    logDate: row.log_date,
    mealType: row.meal_type,
    name: row.name,
    emoji: null,
    imageUrl: null,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    sugarG: row.sugar_g,
    sodiumMg: row.sodium_mg,
    servings: row.servings,
    healthScore: row.health_score,
    factors: [],
    source: row.source,
    items: [...(row.meal_items ?? [])].sort((a, b) => a.position - b.position).map(toItem),
  };
}

function toProfile(row: ProfileRow): Profile {
  return {
    displayName: row.display_name,
    sex: row.sex,
    dateOfBirth: row.date_of_birth,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    units: row.units,
    activityLevel: row.activity_level,
    goal: row.goal,
    goalWeightKg: row.goal_weight_kg,
    paceKgPerWeek: row.pace_kg_per_week,
    dietPlan: row.diet_plan,
    // Until onboarding sets real targets, fall back to sensible defaults.
    calorieTarget: row.calorie_target ?? 2000,
    proteinG: row.protein_g ?? 150,
    carbsG: row.carbs_g ?? 200,
    fatG: row.fat_g ?? 67,
    fiberG: row.fiber_g ?? 28,
    sugarG: row.sugar_g ?? 50,
    sodiumMg: row.sodium_mg ?? 2300,
    stepGoal: row.step_goal,
    addBurnedCalories: row.add_burned_calories,
    onboarded: row.onboarded_at !== null,
  };
}

export const supabaseDataSource: DataSource = {
  async getProfile() {
    const { data, error } = await createClient().from("profiles").select("*").maybeSingle();
    if (error) fail("Could not load your profile", error);
    return data ? toProfile(data as ProfileRow) : null;
  },

  async getMeals(from: LogDate, to: LogDate) {
    const { data, error } = await createClient()
      .from("meals")
      .select("*, meal_items(*)")
      .gte("log_date", from)
      .lte("log_date", to)
      .order("logged_at", { ascending: true });
    if (error) fail("Could not load your meals", error);
    return ((data ?? []) as MealRow[]).map(toMeal);
  },

  async getWeightLogs() {
    const { data, error } = await createClient()
      .from("weight_logs")
      .select("log_date, weight_kg")
      .order("log_date", { ascending: true });
    if (error) fail("Could not load your weight history", error);
    return (data ?? []).map(
      (r): WeightLog => ({ logDate: r.log_date as string, weightKg: Number(r.weight_kg) }),
    );
  },

  async getWater(from: LogDate, to: LogDate) {
    const { data, error } = await createClient()
      .from("water_logs")
      .select("log_date, amount_ml")
      .gte("log_date", from)
      .lte("log_date", to);
    if (error) fail("Could not load your water log", error);
    const totals: Record<LogDate, number> = {};
    for (const r of data ?? []) {
      const date = r.log_date as string;
      totals[date] = (totals[date] ?? 0) + Number(r.amount_ml);
    }
    return totals;
  },

  async getActivity(from: LogDate, to: LogDate) {
    const { data, error } = await createClient()
      .from("daily_activity")
      .select("log_date, steps, active_kcal")
      .gte("log_date", from)
      .lte("log_date", to);
    if (error) fail("Could not load your activity", error);
    return (data ?? []).map(
      (r): DailyActivity => ({
        logDate: r.log_date as string,
        steps: Number(r.steps),
        activeKcal: Number(r.active_kcal),
      }),
    );
  },

  async addWater(amountMl: number) {
    // log_date is filled in by the database from logged_at, in Malaysia time.
    const { error } = await createClient()
      .from("water_logs")
      .insert({ amount_ml: amountMl, logged_at: new Date().toISOString() });
    if (error) fail("Could not log water", error);
  },

  async deleteMeal(id: string) {
    const { error } = await createClient().from("meals").delete().eq("id", id);
    if (error) fail("Could not delete the meal", error);
  },
};
