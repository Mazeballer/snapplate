"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AnalyzingView } from "@/components/log/analyzing-view";
import { LogPage } from "@/components/log/log-page";
import { ReviewMeal } from "@/components/log/review-meal";
import { useLogDate, useSaveMeal } from "@/components/log/use-log";
import { Button } from "@/components/ui/button";
import { analyzeText, fixMeal } from "@/lib/ai/client";
import { ERROR_MESSAGES, type AnalyzeErrorCode } from "@/lib/ai/schema";
import type { MealDraft } from "@/lib/types";

const EXAMPLES = ["2 roti canai with dhal and a teh tarik", "Chicken rice, one plate", "Grilled chicken salad with brown rice"];
const STEPS = ["Reading your description…", "Estimating portions…", "Searching nutrition data…", "Finalizing results…"];

export function DescribeScreen() {
  const logDate = useLogDate();
  const { save, saving } = useSaveMeal(logDate);

  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"input" | "analyzing" | "review">("input");
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const [favourite, setFavourite] = useState(false);
  const [error, setError] = useState<AnalyzeErrorCode | null>(null);

  async function analyze() {
    setPhase("analyzing");
    setError(null);
    const result = await analyzeText(text.trim());
    if (result.ok) {
      setDraft(result.value);
      setPhase("review");
    } else {
      setError(result.error);
      setPhase("input");
    }
  }

  async function fix(correction: string): Promise<boolean> {
    if (!draft) return false;
    const result = await fixMeal(draft, correction);
    if (!result.ok) {
      toast.error(ERROR_MESSAGES[result.error]);
      return false;
    }
    setDraft({ ...result.value, mealType: draft.mealType, servings: 1 });
    return true;
  }

  if (phase === "analyzing") {
    return (
      <LogPage title="Describe" onBack={() => setPhase("input")}>
        <AnalyzingView messages={STEPS} />
      </LogPage>
    );
  }

  if (phase === "review" && draft) {
    return (
      <LogPage
        title="Your meal"
        onBack={() => setPhase("input")}
        footer={
          <Button size="lg" className="h-12 w-full rounded-full text-[17px] font-semibold" disabled={saving || draft.name.trim().length === 0} onClick={() => void save(draft, { favourite })}>
            {saving ? "Saving…" : "Add meal"}
          </Button>
        }
      >
        <ReviewMeal draft={draft} onChange={setDraft} favourite={favourite} onFavouriteChange={setFavourite} onFix={fix} />
      </LogPage>
    );
  }

  return (
    <LogPage
      title="Describe"
      footer={
        <Button size="lg" className="h-12 w-full gap-2 rounded-full text-[17px] font-semibold" disabled={text.trim().length < 2} onClick={() => void analyze()}>
          <Sparkles aria-hidden />
          Estimate
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-[28px] leading-8 font-bold tracking-tight">What did you eat?</h2>
        <p className="text-[15px] text-muted-foreground">Include portions if you can. It makes the estimate more accurate.</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 500))}
        rows={5}
        autoFocus
        placeholder="For example: a plate of nasi lemak with fried chicken and an iced teh"
        aria-label="Describe what you ate"
        className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-base outline-none focus:border-foreground"
      />
      <div className="flex flex-wrap gap-2" aria-label="Examples">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setText(example)}
            className="rounded-full border border-border bg-card px-3 py-2 text-left text-xs font-medium active:bg-muted"
          >
            {example}
          </button>
        ))}
      </div>
      {error ? (
        <p className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          {ERROR_MESSAGES[error]}
        </p>
      ) : null}
    </LogPage>
  );
}
