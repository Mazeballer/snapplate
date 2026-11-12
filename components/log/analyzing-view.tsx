"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

/** Shown while the AI works: a spinner and a line of text that steps through what is happening. */
export function AnalyzingView({ messages, thumbnail }: { messages: string[]; thumbnail?: string | null }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => Math.min(messages.length - 1, i + 1)), 1300);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center" role="status" aria-live="polite">
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt="" className="size-40 rounded-[28px] object-cover shadow-md" />
      ) : null}
      <Loader2 className="size-9 animate-spin text-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-xl font-bold">{messages[index]}</p>
        <p className="text-sm text-muted-foreground">This takes a few seconds.</p>
      </div>
    </div>
  );
}
