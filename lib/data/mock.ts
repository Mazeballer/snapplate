/**
 * Sample data for previewing the UI (NEXT_PUBLIC_MOCK=true). Everything is generated from
 * today's Malaysia date, so the screens always look current: about two months of meals with a
 * recent logging streak, a weight trend, water and step counts. Changes you make (adding water,
 * deleting a meal) live in memory until the page is reloaded.
 */
import { HISTORY_DAYS } from "@/lib/constants";
import {
  calorieTarget,
  macroTargets,
  type ActivityLevel,
  type BodyStats,
} from "@/lib/nutrition";
import {
  addDays,
  ageOn,
  dateRange,
  minutesSinceMidnight,
  startOfLogDate,
  toLogDate,
  todayLogDate,
  type LogDate,
} from "@/lib/time";
import type {
  DailyActivity,
  Exercise,
  ExerciseInput,
  HealthFactor,
  Meal,
  MealDraft,
  MealInput,
  MealItem,
  MealType,
  Profile,
  SavedMeal,
  SavedMealInput,
  WeightLog,
} from "@/lib/types";
import type { DataSource } from "./source";

// --- tiny seeded random numbers, so the same date always gives the same food ---------------

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- the menu ---------------------------------------------------------------------------

type ItemRow = [name: string, qty: number, unit: string, kcal: number, p: number, c: number, f: number];

interface Dish {
  name: string;
  emoji: string;
  type: MealType;
  items: ItemRow[];
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  score: number;
  factors: HealthFactor[];
}

const good = (label: string, note: string): HealthFactor => ({ label, quality: "good", note });
const fair = (label: string, note: string): HealthFactor => ({ label, quality: "fair", note });
const bad = (label: string, note: string): HealthFactor => ({ label, quality: "bad", note });

const BREAKFASTS: Dish[] = [
  {
    name: "Nasi lemak with egg",
    emoji: "🍛",
    type: "breakfast",
    items: [
      ["Coconut rice", 1, "plate", 340, 6, 54, 11],
      ["Fried egg", 1, "egg", 90, 6, 0, 7],
      ["Sambal", 2, "tbsp", 70, 1, 6, 5],
      ["Anchovies and peanuts", 1, "handful", 110, 7, 4, 8],
      ["Cucumber slices", 4, "slices", 8, 0, 2, 0],
    ],
    fiberG: 4,
    sugarG: 6,
    sodiumMg: 980,
    score: 4.5,
    factors: [
      bad("Saturated fat", "Coconut milk and fried toppings add a lot."),
      fair("Fibre", "Little vegetable on the plate."),
      fair("Sodium", "Sambal and anchovies are salty."),
    ],
  },
  {
    name: "Roti canai with dhal",
    emoji: "🫓",
    type: "breakfast",
    items: [
      ["Roti canai", 2, "pieces", 560, 12, 78, 22],
      ["Dhal curry", 0.5, "cup", 110, 6, 14, 3],
    ],
    fiberG: 5,
    sugarG: 4,
    sodiumMg: 820,
    score: 4,
    factors: [
      bad("Refined carbs", "White flour dough cooked in oil."),
      good("Protein", "The dhal adds plant protein."),
      fair("Sodium", "Curry is on the salty side."),
    ],
  },
  {
    name: "Oatmeal with banana and almonds",
    emoji: "🥣",
    type: "breakfast",
    items: [
      ["Rolled oats", 50, "g", 190, 7, 33, 4],
      ["Banana", 1, "medium", 105, 1, 27, 0],
      ["Almonds", 15, "g", 90, 3, 3, 8],
      ["Milk", 150, "ml", 75, 5, 7, 3],
    ],
    fiberG: 9,
    sugarG: 18,
    sodiumMg: 90,
    score: 8.5,
    factors: [
      good("Fibre", "Oats and banana keep you full."),
      good("Processing", "Mostly whole foods."),
      good("Sodium", "Very low."),
    ],
  },
  {
    name: "Boiled eggs and toast with kopi",
    emoji: "☕",
    type: "breakfast",
    items: [
      ["Boiled eggs", 2, "eggs", 155, 13, 1, 11],
      ["Wholemeal toast", 2, "slices", 160, 8, 28, 2],
      ["Kopi with milk", 1, "cup", 60, 2, 8, 2],
    ],
    fiberG: 5,
    sugarG: 7,
    sodiumMg: 480,
    score: 7,
    factors: [
      good("Protein", "Eggs are an easy high-protein start."),
      fair("Sugar", "A little from the sweetened coffee."),
      good("Processing", "Simple ingredients."),
    ],
  },
  {
    name: "Mee goreng mamak",
    emoji: "🍜",
    type: "breakfast",
    items: [
      ["Fried yellow noodles", 1, "plate", 420, 12, 76, 6],
      ["Fried egg", 1, "egg", 90, 6, 0, 7],
      ["Tofu and vegetables", 1, "portion", 130, 6, 10, 9],
    ],
    fiberG: 6,
    sugarG: 9,
    sodiumMg: 1350,
    score: 4.5,
    factors: [
      bad("Sodium", "Sauces make this very salty."),
      fair("Refined carbs", "Mostly noodles."),
      good("Vegetables", "Some greens and tofu."),
    ],
  },
];

const LUNCHES: Dish[] = [
  {
    name: "Chicken rice",
    emoji: "🍗",
    type: "lunch",
    items: [
      ["Steamed chicken", 120, "g", 200, 28, 0, 9],
      ["Chicken rice", 1, "bowl", 300, 5, 56, 6],
      ["Cucumber and soup", 1, "serving", 20, 1, 3, 0],
      ["Chilli and ginger sauce", 2, "tbsp", 25, 0, 5, 0],
    ],
    fiberG: 3,
    sugarG: 4,
    sodiumMg: 1050,
    score: 6.5,
    factors: [
      good("Protein", "Lean steamed chicken."),
      fair("Sodium", "Rice and sauces add salt."),
      fair("Fibre", "Low in vegetables."),
    ],
  },
  {
    name: "Grilled chicken salad bowl",
    emoji: "🥗",
    type: "lunch",
    items: [
      ["Grilled chicken breast", 150, "g", 245, 46, 0, 5],
      ["Mixed greens", 1, "bowl", 25, 2, 5, 0],
      ["Olive oil dressing", 1, "tbsp", 120, 0, 0, 14],
      ["Cherry tomatoes", 6, "pieces", 20, 1, 4, 0],
      ["Brown rice", 0.5, "cup", 110, 2, 23, 1],
    ],
    fiberG: 6,
    sugarG: 5,
    sodiumMg: 420,
    score: 9,
    factors: [
      good("Protein", "High and lean."),
      good("Fibre", "Plenty of vegetables."),
      good("Processing", "Whole foods."),
    ],
  },
  {
    name: "Penang laksa",
    emoji: "🍲",
    type: "lunch",
    items: [
      ["Rice noodles", 1, "bowl", 300, 6, 66, 1],
      ["Fish and tamarind broth", 1, "bowl", 110, 9, 10, 4],
      ["Fish and prawn toppings", 1, "portion", 70, 12, 2, 2],
    ],
    fiberG: 4,
    sugarG: 8,
    sodiumMg: 1600,
    score: 5.5,
    factors: [
      bad("Sodium", "The broth is very high in salt."),
      good("Protein", "Fish and prawns."),
      fair("Refined carbs", "A big bowl of noodles."),
    ],
  },
  {
    name: "Nasi campur plate",
    emoji: "🍱",
    type: "lunch",
    items: [
      ["Steamed rice", 1, "plate", 260, 5, 57, 1],
      ["Ayam masak merah", 1, "piece", 190, 18, 6, 10],
      ["Sayur lodeh", 1, "serving", 90, 3, 8, 5],
      ["Fried tempeh", 3, "slices", 110, 7, 6, 7],
    ],
    fiberG: 5,
    sugarG: 5,
    sodiumMg: 1100,
    score: 6,
    factors: [
      good("Vegetables", "Some vegetables and tempeh."),
      fair("Sodium", "Gravies add salt."),
      fair("Fat", "A few fried items."),
    ],
  },
];

const DINNERS: Dish[] = [
  {
    name: "Chicken satay with ketupat",
    emoji: "🍢",
    type: "dinner",
    items: [
      ["Chicken satay", 6, "sticks", 300, 27, 9, 17],
      ["Ketupat", 2, "pieces", 180, 3, 40, 0],
      ["Peanut sauce", 3, "tbsp", 130, 5, 9, 9],
    ],
    fiberG: 4,
    sugarG: 12,
    sodiumMg: 900,
    score: 5,
    factors: [
      fair("Sugar", "Sweet marinade and sauce."),
      good("Protein", "Plenty from the chicken."),
      bad("Fat", "Grilling with oil and peanut sauce."),
    ],
  },
  {
    name: "Grilled sambal fish with kailan",
    emoji: "🐟",
    type: "dinner",
    items: [
      ["Grilled sambal fish", 150, "g", 230, 32, 4, 9],
      ["Steamed rice", 1, "cup", 200, 4, 44, 0],
      ["Stir-fried kailan", 1, "serving", 80, 3, 8, 4],
    ],
    fiberG: 5,
    sugarG: 4,
    sodiumMg: 640,
    score: 8,
    factors: [
      good("Protein", "Lean fish."),
      good("Vegetables", "Leafy greens."),
      good("Processing", "Fresh ingredients."),
    ],
  },
  {
    name: "Beef rendang with rice",
    emoji: "🥘",
    type: "dinner",
    items: [
      ["Beef rendang", 100, "g", 280, 22, 6, 19],
      ["Steamed rice", 1, "cup", 205, 4, 45, 0],
      ["Cucumber", 4, "slices", 15, 0, 3, 0],
    ],
    fiberG: 3,
    sugarG: 5,
    sodiumMg: 820,
    score: 5,
    factors: [
      bad("Saturated fat", "Rich coconut gravy."),
      good("Protein", "Good amount."),
      fair("Fibre", "Needs more vegetables."),
    ],
  },
  {
    name: "Tom yum prawns with rice",
    emoji: "🦐",
    type: "dinner",
    items: [
      ["Tom yum prawn soup", 1, "bowl", 220, 22, 12, 9],
      ["Steamed rice", 1, "cup", 205, 4, 45, 0],
    ],
    fiberG: 3,
    sugarG: 6,
    sodiumMg: 1250,
    score: 7.5,
    factors: [
      good("Protein", "Prawns are lean."),
      bad("Sodium", "Broth is salty."),
      good("Processing", "Fresh herbs and seafood."),
    ],
  },
];

const SNACKS: Dish[] = [
  {
    name: "Apple with peanut butter",
    emoji: "🍎",
    type: "snack",
    items: [
      ["Apple", 1, "medium", 95, 0, 25, 0],
      ["Peanut butter", 1, "tbsp", 95, 4, 3, 8],
    ],
    fiberG: 5,
    sugarG: 19,
    sodiumMg: 70,
    score: 8.5,
    factors: [good("Fibre", "Whole fruit."), good("Processing", "Two simple ingredients."), good("Sodium", "Very low.")],
  },
  {
    name: "Greek yogurt with honey",
    emoji: "🍯",
    type: "snack",
    items: [
      ["Greek yogurt", 150, "g", 110, 10, 6, 4],
      ["Honey", 1, "tsp", 40, 0, 12, 0],
    ],
    fiberG: 0,
    sugarG: 17,
    sodiumMg: 60,
    score: 8,
    factors: [good("Protein", "Good for a snack."), fair("Sugar", "From the honey."), good("Processing", "Minimal.")],
  },
  {
    name: "Two curry puffs",
    emoji: "🥟",
    type: "snack",
    items: [["Curry puff", 2, "pieces", 380, 8, 42, 20]],
    fiberG: 3,
    sugarG: 3,
    sodiumMg: 640,
    score: 3.5,
    factors: [bad("Fat", "Deep fried pastry."), bad("Refined carbs", "White flour crust."), fair("Sodium", "Moderate.")],
  },
  {
    name: "Teh tarik",
    emoji: "🧋",
    type: "snack",
    items: [["Teh tarik", 1, "glass", 130, 3, 20, 4]],
    fiberG: 0,
    sugarG: 19,
    sodiumMg: 60,
    score: 3,
    factors: [bad("Added sugar", "Sweetened with condensed milk."), good("Sodium", "Very low."), fair("Processing", "Fine in moderation.")],
  },
  {
    name: "Iced Milo",
    emoji: "🥤",
    type: "snack",
    items: [["Iced Milo", 1, "glass", 200, 6, 34, 5]],
    fiberG: 1,
    sugarG: 27,
    sodiumMg: 110,
    score: 3,
    factors: [bad("Added sugar", "Sweetened malt drink."), fair("Processing", "Powdered mix."), good("Sodium", "Low.")],
  },
];

const MEAL_MINUTES: Record<MealType, number> = {
  breakfast: 8 * 60 + 15,
  lunch: 12 * 60 + 40,
  dinner: 19 * 60 + 30,
  snack: 16 * 60,
};

const pick = <T,>(list: T[], r: () => number): T => list[Math.floor(r() * list.length)]!;
const round1 = (n: number) => Math.round(n * 10) / 10;

function buildMeal(date: LogDate, dish: Dish, r: () => number): Meal {
  // Vary the portion a little so no two days are identical.
  const scale = 0.85 + r() * 0.4;
  const items: MealItem[] = dish.items.map(([name, qty, unit, kcal, p, c, f], i) => ({
    id: `${date}-${dish.type}-${i}`,
    name,
    quantity: round1(qty * scale),
    unit,
    calories: Math.round(kcal * scale),
    proteinG: round1(p * scale),
    carbsG: round1(c * scale),
    fatG: round1(f * scale),
  }));
  const sum = (key: "calories" | "proteinG" | "carbsG" | "fatG") =>
    items.reduce((total, item) => total + item[key], 0);
  const minutes = MEAL_MINUTES[dish.type] + Math.floor(r() * 40) - 20;
  const loggedAt = new Date(startOfLogDate(date).getTime() + minutes * 60_000);

  return {
    id: `${date}-${dish.type}`,
    loggedAt: loggedAt.toISOString(),
    logDate: date,
    mealType: dish.type,
    name: dish.name,
    emoji: dish.emoji,
    imageUrl: null,
    calories: Math.round(sum("calories")),
    proteinG: round1(sum("proteinG")),
    carbsG: round1(sum("carbsG")),
    fatG: round1(sum("fatG")),
    fiberG: round1(dish.fiberG * scale),
    sugarG: round1(dish.sugarG * scale),
    sodiumMg: Math.round(dish.sodiumMg * scale),
    servings: 1,
    healthScore: dish.score,
    factors: dish.factors,
    source: r() < 0.7 ? "photo" : r() < 0.5 ? "text" : "manual",
    items,
  };
}

function buildMeals(today: LogDate): Meal[] {
  const meals: Meal[] = [];
  const nowMinutes = minutesSinceMidnight();

  for (const date of dateRange(addDays(today, -(HISTORY_DAYS - 1)), today)) {
    const r = rng(`meals-${date}`);
    const daysAgo = dateRange(date, today).length - 1;

    // A few missed days further back, but a clean recent streak.
    if (daysAgo > 9 && r() < 0.1) continue;

    const dishes: Dish[] = [pick(BREAKFASTS, r), pick(LUNCHES, r), pick(DINNERS, r)];
    if (r() < 0.7) dishes.push(pick(SNACKS, r));

    for (const dish of dishes) {
      const meal = buildMeal(date, dish, r);
      // Today only shows what would already have been eaten.
      if (daysAgo === 0 && MEAL_MINUTES[dish.type] > nowMinutes) continue;
      meals.push(meal);
    }
  }
  return meals;
}

// --- profile, weight, steps, water ------------------------------------------------------------

const MOCK_DOB = "1996-05-14";
const MOCK_ACTIVITY: ActivityLevel = "moderate";

function buildProfile(today: LogDate, weightKg: number): Profile {
  const stats: BodyStats = {
    sex: "male",
    weightKg,
    heightCm: 175,
    age: ageOn(MOCK_DOB, today),
  };
  const target = calorieTarget(stats, MOCK_ACTIVITY, "lose", 0.5);
  const macros = macroTargets(target.calories, "balanced");
  return {
    displayName: "Alex",
    sex: "male",
    dateOfBirth: MOCK_DOB,
    heightCm: 175,
    weightKg,
    units: "metric",
    activityLevel: MOCK_ACTIVITY,
    goal: "lose",
    goalWeightKg: 72,
    paceKgPerWeek: 0.5,
    dietPlan: "balanced",
    dietaryPreference: null,
    restrictions: [],
    calorieOverride: false,
    rolloverCalories: false,
    calorieTarget: target.calories,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    fiberG: macros.fiberG,
    sugarG: macros.sugarG,
    sodiumMg: macros.sodiumMg,
    stepGoal: 10000,
    addBurnedCalories: false,
    onboarded: true,
  };
}

function buildWeights(today: LogDate): WeightLog[] {
  const logs: WeightLog[] = [];
  const total = 120;
  for (let ago = total; ago >= 2; ago -= 3) {
    const date = addDays(today, -ago);
    const r = rng(`weight-${date}`);
    const progress = (total - ago) / total;
    const trend = 82 - 3.8 * progress;
    logs.push({ logDate: date, weightKg: round1(trend + (r() - 0.5) * 0.7) });
  }
  return logs;
}

function buildActivity(today: LogDate): DailyActivity[] {
  return dateRange(addDays(today, -29), today).map((date) => {
    const r = rng(`steps-${date}`);
    const full = 5500 + Math.floor(r() * 6500);
    const fraction = date === today ? Math.min(1, minutesSinceMidnight() / 1260) : 1;
    const steps = Math.round(full * fraction);
    return { logDate: date, steps, activeKcal: Math.round(steps * 0.042) };
  });
}

function buildWater(today: LogDate): Map<LogDate, number> {
  const map = new Map<LogDate, number>();
  for (const date of dateRange(addDays(today, -29), today)) {
    const r = rng(`water-${date}`);
    map.set(date, Math.round((900 + r() * 1700) / 50) * 50);
  }
  map.set(today, 1250);
  return map;
}

// --- the data source ------------------------------------------------------------------------

// --- saved meals, workouts and sample AI answers ---------------------------------------------------

const ALL_DISHES: Dish[] = [...BREAKFASTS, ...LUNCHES, ...DINNERS, ...SNACKS];

function dishItems(dish: Dish) {
  return dish.items.map(([name, qty, unit, kcal, p, c, f]) => ({
    name,
    quantity: qty,
    unit,
    calories: kcal,
    proteinG: p,
    carbsG: c,
    fatG: f,
  }));
}

function dishDraft(dish: Dish, source: "photo" | "text"): MealDraft {
  const items = dishItems(dish);
  const sum = (key: "calories" | "proteinG" | "carbsG" | "fatG") => items.reduce((t, i) => t + i[key], 0);
  return {
    name: dish.name,
    emoji: dish.emoji,
    mealType: dish.type,
    imagePath: null,
    imagePreview: null,
    source,
    aiTraceId: "preview",
    confidence: "medium",
    calories: sum("calories"),
    proteinG: sum("proteinG"),
    carbsG: sum("carbsG"),
    fatG: sum("fatG"),
    fiberG: dish.fiberG,
    sugarG: dish.sugarG,
    sodiumMg: dish.sodiumMg,
    servings: 1,
    healthScore: dish.score,
    factors: dish.factors,
    items,
  };
}

/** A sample "AI" answer for preview mode: the best-matching dish for the words, or a random one. */
export function mockAnalyzeMeal(text: string | null, source: "photo" | "text"): MealDraft {
  const words = (text ?? "").toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
  let best: Dish | null = null;
  let bestScore = 0;
  for (const dish of ALL_DISHES) {
    const hay = `${dish.name} ${dish.items.map((i) => i[0]).join(" ")}`.toLowerCase();
    const score = words.filter((w) => hay.includes(w)).length;
    if (score > bestScore) {
      best = dish;
      bestScore = score;
    }
  }
  const r = rng(`analyze-${text ?? ""}-${Date.now()}`);
  return dishDraft(best ?? pick(ALL_DISHES, r), source);
}

const MET: [RegExp, number, string][] = [
  [/run|jog/i, 9.8, "Running"],
  [/swim/i, 7, "Swimming"],
  [/cycl|bike/i, 7.5, "Cycling"],
  [/walk/i, 3.8, "Walking"],
  [/yoga|stretch|pilates/i, 3, "Yoga"],
  [/weight|lift|gym|strength/i, 5, "Weight training"],
  [/hiit|circuit/i, 8, "HIIT"],
  [/football|basketball|badminton|tennis|futsal/i, 7, "Sports"],
];

/** A sample "AI" estimate for a workout, from a standard MET table. Preview mode only. */
export function mockAnalyzeExercise(text: string, weightKg: number): ExerciseInput | null {
  const found = MET.find(([re]) => re.test(text));
  if (!found) return null;
  const minutes = Math.min(600, Math.max(5, Number(/(\d{1,3})\s*(?:min|m\b)/i.exec(text)?.[1] ?? 30)));
  const hours = Number(/(\d{1,2}(?:\.\d)?)\s*(?:h|hr|hour)/i.exec(text)?.[1] ?? 0);
  const duration = hours > 0 ? Math.round(hours * 60) : minutes;
  const [, met, name] = found;
  return {
    loggedAt: new Date().toISOString(),
    name,
    durationMin: duration,
    intensity: met >= 8 ? "high" : met >= 5 ? "medium" : "low",
    calories: Math.round((met * weightKg * duration) / 60),
    source: "text",
  };
}

function buildSavedMeals(): SavedMeal[] {
  return [ALL_DISHES[2]!, ALL_DISHES[5]!, ALL_DISHES[9]!, ALL_DISHES[13]!].map((dish, i) => {
    const d = dishDraft(dish, "text");
    return {
      id: `saved-${i}`,
      name: d.name,
      emoji: d.emoji,
      calories: d.calories,
      proteinG: d.proteinG,
      carbsG: d.carbsG,
      fatG: d.fatG,
      fiberG: d.fiberG,
      sugarG: d.sugarG,
      sodiumMg: d.sodiumMg,
      healthScore: d.healthScore,
      factors: d.factors,
      items: d.items,
      createdAt: new Date(Date.now() - i * 86_400_000).toISOString(),
    };
  });
}

function buildExercise(today: LogDate): Exercise[] {
  const at = (date: LogDate, minutes: number) =>
    new Date(startOfLogDate(date).getTime() + minutes * 60_000).toISOString();
  return [
    { id: "ex-1", daysAgo: 1, minutes: 18 * 60, name: "Running", durationMin: 35, intensity: "high" as const, calories: 380 },
    { id: "ex-2", daysAgo: 3, minutes: 7 * 60, name: "Weight training", durationMin: 50, intensity: "medium" as const, calories: 290 },
    { id: "ex-3", daysAgo: 0, minutes: 7 * 60 + 30, name: "Walking", durationMin: 40, intensity: "low" as const, calories: 160 },
  ].map(({ id, daysAgo, minutes, ...rest }) => {
    const date = addDays(today, -daysAgo);
    return { id, loggedAt: at(date, minutes), logDate: date, source: "manual" as const, ...rest };
  });
}

interface Store {
  today: LogDate;
  meals: Meal[];
  weights: WeightLog[];
  activity: DailyActivity[];
  water: Map<LogDate, number>;
  profile: Profile;
  savedMeals: SavedMeal[];
  exercise: Exercise[];
}

let store: Store | null = null;

function getStore(): Store {
  const today = todayLogDate();
  if (!store || store.today !== today) {
    const weights = buildWeights(today);
    store = {
      today,
      meals: buildMeals(today),
      weights,
      activity: buildActivity(today),
      water: buildWater(today),
      profile: buildProfile(today, weights[weights.length - 1]!.weightKg),
      savedMeals: buildSavedMeals(),
      exercise: buildExercise(today),
    };
  }
  return store;
}

const delay = (ms = 220) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const mockDataSource: DataSource = {
  async getProfile() {
    await delay();
    return getStore().profile;
  },
  async getMeals(from, to) {
    await delay();
    return getStore().meals.filter((m) => m.logDate >= from && m.logDate <= to);
  },
  async getWeightLogs() {
    await delay();
    return getStore().weights;
  },
  async getWater(from, to) {
    await delay();
    const result: Record<LogDate, number> = {};
    for (const [date, ml] of getStore().water) {
      if (date >= from && date <= to) result[date] = ml;
    }
    return result;
  },
  async getActivity(from, to) {
    await delay();
    return getStore().activity.filter((a) => a.logDate >= from && a.logDate <= to);
  },
  async saveProfile({ profile, weightLog }) {
    await delay(300);
    const s = getStore();
    s.profile = profile;
    if (weightLog) {
      s.weights = [...s.weights.filter((w) => w.logDate !== weightLog.logDate), weightLog].sort((a, b) =>
        a.logDate < b.logDate ? -1 : 1,
      );
    }
  },
  async getSavedMeals() {
    await delay();
    return getStore().savedMeals;
  },
  async getExercise(from, to) {
    await delay();
    return getStore().exercise.filter((e) => e.logDate >= from && e.logDate <= to);
  },
  async addMeal(input: MealInput) {
    await delay(300);
    const s = getStore();
    const id = `new-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const meal: Meal = {
      id,
      loggedAt: input.loggedAt,
      logDate: toLogDate(input.loggedAt),
      mealType: input.mealType,
      name: input.name,
      emoji: input.emoji,
      // In preview a photo is a local blob link, usable as-is.
      imageUrl: input.imagePath,
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      fiberG: input.fiberG,
      sugarG: input.sugarG,
      sodiumMg: input.sodiumMg,
      servings: input.servings,
      healthScore: input.healthScore,
      factors: input.factors,
      source: input.source,
      items: input.items.map((item, i): MealItem => ({ id: `${id}-${i}`, ...item })),
    };
    s.meals = [...s.meals, meal].sort((a, b) => (a.loggedAt < b.loggedAt ? -1 : 1));
  },
  async saveFavourite(input: SavedMealInput) {
    await delay(150);
    const s = getStore();
    s.savedMeals = [{ ...input, id: `saved-${Date.now()}`, createdAt: new Date().toISOString() }, ...s.savedMeals];
  },
  async deleteSavedMeal(id) {
    await delay(120);
    const s = getStore();
    s.savedMeals = s.savedMeals.filter((m) => m.id !== id);
  },
  async addExercise(input) {
    await delay(200);
    const s = getStore();
    const entry: Exercise = { id: `ex-${Date.now()}`, logDate: toLogDate(input.loggedAt), ...input };
    s.exercise = [...s.exercise, entry].sort((a, b) => (a.loggedAt < b.loggedAt ? -1 : 1));
  },
  async deleteExercise(id) {
    await delay(120);
    const s = getStore();
    s.exercise = s.exercise.filter((e) => e.id !== id);
  },
  async uploadMealPhoto(photo) {
    await delay(150);
    return URL.createObjectURL(photo);
  },
  async addWater(amountMl) {
    await delay(120);
    const s = getStore();
    s.water.set(s.today, (s.water.get(s.today) ?? 0) + amountMl);
  },
  async deleteMeal(id) {
    await delay(120);
    const s = getStore();
    s.meals = s.meals.filter((m) => m.id !== id);
  },
};
