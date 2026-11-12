"use client";

import { Bookmark, Database, Dumbbell, ScanLine, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSelectedDate } from "@/components/snapplate/selected-date";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";

interface Tile {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** The same four tiles, in the same order, as the reference app's + menu. */
const TILES: Tile[] = [
  { href: "/log/exercise", label: "Log Exercise", icon: Dumbbell },
  { href: "/log/saved", label: "Saved Foods", icon: Bookmark },
  { href: "/log/foods", label: "Food Database", icon: Database },
  { href: "/log/scan", label: "Scan Food", icon: ScanLine },
];

function TileButton({ tile, onSelect }: { tile: Tile; onSelect: (href: string) => void }) {
  const Icon = tile.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(tile.href)}
      className="flex h-[120px] flex-col items-center justify-center gap-1.5 rounded-[15px] border-[1.5px] border-input bg-card p-1 transition-transform active:scale-[0.98]"
    >
      <span className="flex size-[50px] items-center justify-center rounded-[15px] bg-background">
        <Icon className="size-[30px]" aria-hidden />
      </span>
      <span className="text-sm leading-[21px] font-bold">{tile.label}</span>
    </button>
  );
}

export function LogSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { picked } = useSelectedDate();

  function handleSelect(href: string) {
    onOpenChange(false);
    // Entries are recorded on the day being viewed on Home.
    router.push(picked ? `${href}?date=${picked}` : href);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerTitle className="sr-only">Log</DrawerTitle>
        <DrawerDescription className="sr-only">Choose what to add</DrawerDescription>
        <div className="grid grid-cols-2 gap-3 px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {TILES.map((tile) => (
            <TileButton key={tile.href} tile={tile} onSelect={handleSelect} />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
