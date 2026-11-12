"use client";

import { Dumbbell, PencilLine, Sparkles, TextCursorInput, Zap, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { AnalyzingView } from "@/components/log/analyzing-view";
import { LogPage } from "@/components/log/log-page";
import { useLogDate, useSaveExercise } from "@/components/log/use-log";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-data";
import { analyzeWorkout } from "@/lib/ai/client";
import { ERROR_MESSAGES, type AnalyzeErrorCode } from "@/lib/ai/schema";
import { DURATION_PRESETS, estimateWorkoutCalories, WORKOUT_NAME, type WorkoutKind } from "@/lib/exercise";
import { formatNumber } from "@/lib/format";
import type { ExerciseInput, ExerciseIntensity } from "@/lib/types";
import { cn } from "@/lib/utils";

const INTENSITIES: { value: ExerciseIntensity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const EXAMPLES = ["Ran 5 km in 30 minutes", "Weight training for 45 minutes", "Cycled 1 hour, easy pace"];
const digits = (v: string) => v.replace(/[^0-9]/g, "").slice(0, 4);

interface Form {
  name: string;
  minutes: string;
  intensity: ExerciseIntensity;
  calories: string;
  source: "manual" | "text";
}

const BLANK: Form = { name: "", minutes: "", intensity: "medium", calories: "", source: "manual" };

function toForm(input: ExerciseInput): Form {
  return {
    name: input.name,
    minutes: String(input.durationMin ?? ""),
    intensity: input.intensity ?? "medium",
    calories: String(input.calories),
    source: input.source,
  };
}

export function ExerciseScreen() {
  const logDate = useLogDate();
  const { save, saving } = useSaveExercise(logDate);
  const { data: profile } = useProfile();

  // menu: the four choices. kind: Run or Weight lifting, set by intensity and time. describe / manual: the other two.
  const [mode, setMode] = useState<"menu" | "kind" | "describe" | "manual">("menu");
  const [kind, setKind] = useState<WorkoutKind>("run");
  const [kindMinutes, setKindMinutes] = useState("30");
  const [kindIntensity, setKindIntensity] = useState<ExerciseIntensity>("medium");
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<AnalyzeErrorCode | null>(null);
  const [form, setForm] = useState<Form>(BLANK);
  const [reviewing, setReviewing] = useState(false);

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    const result = await analyzeWorkout(text.trim(), profile?.weightKg ?? undefined);
    setAnalyzing(false);
    if (result.ok) {
      setForm(toForm(result.value));
      setReviewing(true);
    } else {
      setError(result.error);
    }
  }

  const calories = Number(form.calories);
  const minutes = Number(form.minutes);
  const valid = form.name.trim().length > 0 && form.calories !== "" && calories >= 0 && calories <= 5000 && (form.minutes === "" || (minutes >= 1 && minutes <= 1440));

  function submit() {
    if (!valid) return;
    void save({
      loggedAt: new Date().toISOString(), // replaced with the chosen day when saved
      name: form.name.trim(),
      durationMin: form.minutes === "" ? null : minutes,
      intensity: form.intensity,
      calories,
      source: form.source,
    });
  }

  const showForm = reviewing || mode === "manual";
  const kindCalories = estimateWorkoutCalories(kind, kindIntensity, Number(kindMinutes), profile?.weightKg ?? null);

  function submitKind() {
    if (kindCalories <= 0) return;
    void save({
      loggedAt: new Date().toISOString(),
      name: WORKOUT_NAME[kind],
      durationMin: Number(kindMinutes),
      intensity: kindIntensity,
      calories: kindCalories,
      source: "manual",
    });
  }

  function goBack() {
    if (reviewing) setReviewing(false);
    else {
      setMode("menu");
      setError(null);
    }
  }

  if (analyzing) {
    return (
      <LogPage title="Exercise" onBack={() => setAnalyzing(false)}>
        <AnalyzingView messages={["Reading your workout…", "Estimating effort…", "Calculating calories…"]} />
      </LogPage>
    );
  }

  if (mode === "menu") {
    const choices: { label: string; sub: string; icon: LucideIcon; go: () => void }[] = [
      { label: "Run", sub: "Running, jogging, sprinting", icon: Zap, go: () => { setKind("run"); setMode("kind"); } },
      { label: "Weight lifting", sub: "Gym, machines, weights", icon: Dumbbell, go: () => { setKind("weights"); setMode("kind"); } },
      { label: "Describe", sub: "Write it in your own words", icon: TextCursorInput, go: () => setMode("describe") },
      { label: "Manual", sub: "Enter the calories yourself", icon: PencilLine, go: () => { setForm(BLANK); setMode("manual"); } },
    ];
    return (
      <LogPage title="Log Exercise">
        <div className="flex flex-col gap-2.5">
          {choices.map(({ label, sub, icon: Icon, go }) => (
            <button
              key={label}
              type="button"
              onClick={go}
              className="flex items-center gap-4 rounded-[15px] border-[1.5px] border-input bg-card p-4 text-left transition-transform active:scale-[0.99]"
            >
              <span className="flex size-[50px] shrink-0 items-center justify-center rounded-[15px] bg-background">
                <Icon className="size-[26px]" aria-hidden />
              </span>
              <span className="flex flex-col">
                <span className="text-base font-bold">{label}</span>
                <span className="text-sm text-muted-foreground">{sub}</span>
              </span>
            </button>
          ))}
        </div>
      </LogPage>
    );
  }

  if (mode === "kind") {
    return (
      <LogPage
        title={WORKOUT_NAME[kind]}
        onBack={goBack}
        footer={
          <Button size="lg" className="h-12 w-full rounded-full text-[17px] font-semibold" disabled={kindCalories <= 0 || saving} onClick={submitKind}>
            {saving ? "Saving…" : "Add workout"}
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Set intensity</h2>
          <div role="radiogroup" aria-label="Intensity" className="grid grid-cols-3 gap-1.5">
            {INTENSITIES.map((i) => (
              <button
                key={i.value}
                type="button"
                role="radio"
                aria-checked={kindIntensity === i.value}
                onClick={() => setKindIntensity(i.value)}
                className={cn("h-11 rounded-full text-sm font-semibold transition-colors", kindIntensity === i.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">Duration</h2>
          <div className="flex gap-1.5">
            {DURATION_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setKindMinutes(String(m))}
                className={cn("h-10 flex-1 rounded-full text-sm font-semibold", kindMinutes === String(m) ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}
              >
                {m} min
              </button>
            ))}
          </div>
          <label className="flex items-baseline gap-2 rounded-2xl border border-border bg-card p-3 focus-within:border-foreground">
            <input
              inputMode="numeric"
              value={kindMinutes}
              onChange={(e) => setKindMinutes(digits(e.target.value))}
              placeholder="0"
              aria-label="Duration in minutes"
              className="w-full min-w-0 bg-transparent text-2xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/50"
            />
            <span className="text-sm text-muted-foreground">min</span>
          </label>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-[20px] border border-border bg-card py-6" aria-live="polite">
          <span className="text-sm text-muted-foreground">Estimated burn</span>
          <span className="text-[44px] leading-none font-bold tabular-nums">{formatNumber(kindCalories)}</span>
          <span className="text-sm text-muted-foreground">kcal</span>
        </div>
      </LogPage>
    );
  }

  return (
    <LogPage
      title="Exercise"
      onBack={goBack}
      footer={
        showForm ? (
          <Button size="lg" className="h-12 w-full rounded-full text-[17px] font-semibold" disabled={!valid || saving} onClick={submit}>
            {saving ? "Saving…" : "Add workout"}
          </Button>
        ) : (
          <Button size="lg" className="h-12 w-full gap-2 rounded-full text-[17px] font-semibold" disabled={text.trim().length < 2} onClick={() => void analyze()}>
            <Sparkles aria-hidden />
            Estimate calories
          </Button>
        )
      }
    >
      {!showForm ? (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="text-[28px] leading-8 font-bold tracking-tight">What did you do?</h2>
            <p className="text-[15px] text-muted-foreground">Describe your workout and we&apos;ll estimate the calories burned.</p>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 300))}
            rows={4}
            placeholder="For example: ran 5 km in 30 minutes"
            aria-label="Describe your workout"
            className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-base outline-none focus:border-foreground"
          />
          <div className="flex flex-wrap gap-2" aria-label="Examples">
            {EXAMPLES.map((example) => (
              <button key={example} type="button" onClick={() => setText(example)} className="rounded-full border border-border bg-card px-3 py-2 text-xs font-medium active:bg-muted">
                {example}
              </button>
            ))}
          </div>
          {error ? (
            <p className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
              {ERROR_MESSAGES[error]}
            </p>
          ) : null}
        </>
      ) : (
        <>
          {reviewing ? <p className="text-sm text-muted-foreground">Check the estimate and change anything that looks off.</p> : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">Activity *</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, 120) })}
              placeholder="For example: Running"
              className="h-12 w-full rounded-xl border border-border bg-card px-4 text-base outline-none focus:border-foreground"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-3 focus-within:border-foreground">
              <span className="text-xs font-medium text-muted-foreground">Duration</span>
              <span className="flex items-baseline gap-1">
                <input
                  inputMode="numeric"
                  value={form.minutes}
                  onChange={(e) => setForm({ ...form, minutes: digits(e.target.value) })}
                  placeholder="0"
                  aria-label="Duration in minutes"
                  className="w-full min-w-0 bg-transparent text-2xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/50"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </span>
            </label>
            <label className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-3 focus-within:border-foreground">
              <span className="text-xs font-medium text-muted-foreground">Calories burned *</span>
              <span className="flex items-baseline gap-1">
                <input
                  inputMode="numeric"
                  value={form.calories}
                  onChange={(e) => setForm({ ...form, calories: digits(e.target.value) })}
                  placeholder="0"
                  aria-label="Calories burned"
                  className="w-full min-w-0 bg-transparent text-2xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/50"
                />
                <span className="text-sm text-muted-foreground">kcal</span>
              </span>
            </label>
          </div>
          <div role="radiogroup" aria-label="Intensity" className="grid grid-cols-3 gap-1.5">
            {INTENSITIES.map((i) => (
              <button
                key={i.value}
                type="button"
                role="radio"
                aria-checked={form.intensity === i.value}
                onClick={() => setForm({ ...form, intensity: i.value })}
                className={cn("h-11 rounded-full text-sm font-semibold transition-colors", form.intensity === i.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}
              >
                {i.label}
              </button>
            ))}
          </div>
        </>
      )}
    </LogPage>
  );
}
