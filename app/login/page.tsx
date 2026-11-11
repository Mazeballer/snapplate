import Image from "next/image";
import { Suspense } from "react";
import { GoogleButton } from "@/components/snapplate/google-button";
import { LoginError } from "@/components/snapplate/login-error";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={96}
          height={96}
          priority
          className="rounded-[1.75rem] shadow-lg"
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight">Snapplate</h1>
          <p className="text-balance text-muted-foreground">
            Snap your plate. Know your calories.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Suspense>
          <LoginError />
        </Suspense>
        <GoogleButton />
        <p className="text-center text-xs text-muted-foreground">
          Snapplate is private. Only invited Google accounts can sign in.
        </p>
      </div>
    </main>
  );
}
