import type { LogDate } from "@/lib/time";
import type {
  DailyActivity,
  Exercise,
  ExerciseInput,
  HealthSyncStatus,
  Meal,
  MealInput,
  Profile,
  SavedMeal,
  SavedMealInput,
  WeightLog,
} from "@/lib/types";

/** A profile to save, plus an optional weigh-in to record on the same date. */
export interface SaveProfileInput {
  profile: Profile;
  /** Set when the profile's weight should also be logged as a weigh-in. */
  weightLog?: WeightLog;
  /** True the first time onboarding finishes, to stamp when it was completed. */
  markOnboarded?: boolean;
}

/**
 * Everything the screens read and write. Screens only use this interface; Supabase is behind it.
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
  getSavedMeals(): Promise<SavedMeal[]>;
  getExercise(from: LogDate, to: LogDate): Promise<Exercise[]>;
  saveProfile(input: SaveProfileInput): Promise<void>;
  addMeal(input: MealInput): Promise<void>;
  /** Replaces a logged meal's details and ingredients. Its time and photo stay as they were. */
  updateMeal(id: string, input: MealInput): Promise<void>;
  deleteMeal(id: string): Promise<void>;
  saveFavourite(input: SavedMealInput): Promise<void>;
  deleteSavedMeal(id: string): Promise<void>;
  addExercise(input: ExerciseInput): Promise<void>;
  deleteExercise(id: string): Promise<void>;
  addWater(amountMl: number): Promise<void>;
  getHealthSync(): Promise<HealthSyncStatus>;
  /** Makes a new Apple Health key and returns it. It can only be seen this once; any older key stops working. */
  createHealthToken(): Promise<string>;
  revokeHealthToken(): Promise<void>;
  /** Uploads a meal photo and returns where it is stored (a path, or a local URL in preview). */
  uploadMealPhoto(photo: Blob): Promise<string>;
}
