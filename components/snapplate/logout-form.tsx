"use client";

import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { clearSavedCaches } from "@/lib/persist";

/** The log-out button. Before signing out it wipes the saved copy of your data from this device. */
export function LogoutForm() {
  const queryClient = useQueryClient();
  return (
    <form
      action="/auth/signout"
      method="post"
      className="w-full"
      onSubmit={() => {
        queryClient.clear();
        clearSavedCaches(window.localStorage);
      }}
    >
      <Button type="submit" variant="outline" size="lg" className="h-12 w-full gap-2 rounded-[18px] text-destructive">
        <LogOut aria-hidden />
        Log out
      </Button>
    </form>
  );
}
