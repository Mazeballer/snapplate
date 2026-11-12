"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { AnalyzingView } from "@/components/log/analyzing-view";
import { LogPage } from "@/components/log/log-page";
import { useLogDate, useSaveExercise } from "@/components/log/use-log";
import { Segmented } from "@/components/snapplate/segmented";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-data";
import { analyzeWorkout } from "@/lib/ai/client";
import { ERROR_MESSAGES, type AnalyzeErrorCode } from "@/lib/ai/schema";
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

  const [tab, setTab] = useState<"describe" | "manual">("describe");
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

  const showForm = reviewing || tab === "manual";

  if (analyzing) {
    return (
      <LogPage title="Exercise" onBack={() => setAnalyzing(false)}>
        <AnalyzingView messages={["Reading your workout…", "Estimating effort…", "Calculating calories…"]} />
      </LogPage>
    );
  }

  return (
    <LogPage
      title="Exercise"
      onBack={reviewing ? () => setReviewing(false) : undefined}
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
      {!reviewing ? (
        <div className="flex justify-center">
          <Segmented
            label="How to log"
            options={[
              { value: "describe", label: "Describe" },
              { value: "manual", label: "Manual" },
            ]}
            value={tab}
            onChange={(next) => {
              setTab(next);
              setError(null);
              if (next === "manual") setForm(BLANK);
            }}
          />
        </div>
      ) : null}

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
