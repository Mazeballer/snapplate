import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/snapplate/empty-state";

export const metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">Progress</h1>
      <EmptyState icon={TrendingUp} title="No data yet">
        Log your weight and meals and your trends will show up here.
      </EmptyState>
    </div>
  );
}
