"use client";

import { TriangleAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { isLoginError, LOGIN_ERROR_MESSAGES } from "@/lib/auth-redirect";

/** Explains why sign-in failed, based on the ?error= code the auth routes redirect with. */
export function LoginError() {
  const code = useSearchParams().get("error");
  if (!isLoginError(code)) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-left text-sm text-destructive"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{LOGIN_ERROR_MESSAGES[code]}</p>
    </div>
  );
}
