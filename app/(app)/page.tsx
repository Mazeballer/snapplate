import { UtensilsCrossed } from "lucide-react";
import { EmptyState } from "@/components/snapplate/empty-state";
import { TodayHeading } from "@/components/snapplate/today-heading";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <TodayHeading />
      <EmptyState icon={UtensilsCrossed} title="Nothing logged yet">
        Tap the + button to snap your first meal.
      </EmptyState>
    </div>
  );
}
