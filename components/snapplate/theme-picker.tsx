"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const subscribe = () => () => {};

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser; wait for it to avoid a flash of the wrong state.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const current = mounted ? (theme ?? "system") : "";

  return (
    <ToggleGroup
      value={current ? [current] : []}
      onValueChange={(next) => {
        const choice = next[0];
        if (choice) setTheme(choice);
      }}
      variant="outline"
      spacing={0}
      className="w-full"
      aria-label="Appearance"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem key={value} value={value} className="h-11 flex-1 gap-2">
          <Icon className="size-4" aria-hidden />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
