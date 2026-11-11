import type { LogDate } from "@/lib/time";
import type { DailyActivity, Meal, Profile, WeightLog } from "@/lib/types";

/**
 * Everything the screens read and write. There are two implementations behind it: sample data
 * for previewing the UI (mock mode) and Supabase for real use. Screens only use this interface.
 */
export interface DataSource {
  getProfile(): Promise<Profile | null>;
  /** Meals logged on or between two log dates (inclusive), oldest first. */
  getMeals(from: LogDate, to: LogDate): Promise<Meal[]>;
  /** All weigh-ins, oldest first. */
  getWeightLogs(): Promise<WeightLog[]>;
  /** Millilitres of water per log date, for dates that have any. */
  getWater(from: LogDate, to: LogDate): Promise<Record<LogDate, number>>;
  getActivity(from: LogDate, to: LogDate): Promise<DailyActivity[]>;
  addWater(amountMl: number): Promise<void>;
  deleteMeal(id: string): Promise<void>;
}
