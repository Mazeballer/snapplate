"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AnalyzingView } from "@/components/log/analyzing-view";
import { CameraView } from "@/components/log/camera-view";
import { LogPage } from "@/components/log/log-page";
import { ReviewMeal } from "@/components/log/review-meal";
import { useLogDate, useSaveMeal } from "@/components/log/use-log";
import { Button } from "@/components/ui/button";
import { analyzePhoto, fixMeal } from "@/lib/ai/client";
import { ERROR_MESSAGES, type AnalyzeErrorCode } from "@/lib/ai/schema";
import { blobToBase64, resizePhoto } from "@/lib/image";
import type { MealDraft } from "@/lib/types";
import { useRouter } from "next/navigation";

const STEPS = ["Preparing image…", "Analyzing food…", "Separating ingredients…", "Estimating nutrition…", "Finalizing results…"];

export function ScanScreen() {
  const router = useRouter();
  const logDate = useLogDate();
  const { save, saving } = useSaveMeal(logDate);

  const [phase, setPhase] = useState<"camera" | "analyzing" | "review">("camera");
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const [favourite, setFavourite] = useState(false);
  const [error, setError] = useState<AnalyzeErrorCode | null>(null);
  const [photo, setPhoto] = useState<{ blob: Blob; base64: string; url: string } | null>(null);
  // Only used to free the preview picture's memory when leaving; never read while rendering.
  const lastUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    },
    [],
  );

  async function handlePhoto(source: Blob) {
    setPhase("analyzing");
    setError(null);
    try {
      const small = await resizePhoto(source);
      const base64 = await blobToBase64(small);
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
      const url = URL.createObjectURL(small);
      lastUrl.current = url;
      setPhoto({ blob: small, base64, url });

      const result = await analyzePhoto(base64);
      if (result.ok) {
        setDraft({ ...result.value, imagePreview: url });
        setPhase("review");
      } else {
        setError(result.error);
        setPhase("camera");
      }
    } catch {
      toast.error("We couldn't read that photo. Please try another.");
      setPhase("camera");
    }
  }

  async function fix(correction: string): Promise<boolean> {
    if (!draft || !photo) return false;
    const result = await fixMeal(draft, correction, photo.base64);
    if (!result.ok) {
      toast.error(ERROR_MESSAGES[result.error]);
      return false;
    }
    setDraft({ ...result.value, mealType: draft.mealType, servings: 1, imagePreview: photo.url });
    return true;
  }

  if (phase === "analyzing") {
    return (
      <LogPage title="Scan food" onBack={() => setPhase("camera")}>
        <AnalyzingView messages={STEPS} thumbnail={photo?.url} />
      </LogPage>
    );
  }

  if (phase === "review" && draft) {
    return (
      <LogPage
        title="Your meal"
        onBack={() => setPhase("camera")}
        footer={
          <Button
            size="lg"
            className="h-12 w-full rounded-full text-[17px] font-semibold"
            disabled={saving || draft.name.trim().length === 0}
            onClick={() => void save(draft, { favourite, photo: photo?.blob })}
          >
            {saving ? "Saving…" : "Add meal"}
          </Button>
        }
      >
        <ReviewMeal draft={draft} onChange={setDraft} favourite={favourite} onFavouriteChange={setFavourite} onFix={fix} />
      </LogPage>
    );
  }

  return <CameraView onPhoto={(blob) => void handlePhoto(blob)} onClose={() => router.back()} message={error ? ERROR_MESSAGES[error] : null} />;
}
