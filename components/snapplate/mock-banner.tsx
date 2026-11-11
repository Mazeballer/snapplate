import { FlaskConical } from "lucide-react";
import { MOCK_MODE } from "@/lib/mock";

/** Shown only in mock mode, so sample data is never mistaken for the real thing. */
export function MockBanner() {
  if (!MOCK_MODE) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-warning/20 px-3 py-2 text-xs font-medium">
      <FlaskConical className="size-3.5 shrink-0" aria-hidden />
      Preview mode: this is sample data, not your real log.
    </div>
  );
}
