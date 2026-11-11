import Link from "next/link";

export const metadata = { title: "Privacy policy" };

const UPDATED = "11 November 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-6 py-[calc(2.5rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy policy</h1>
        <p className="text-sm text-muted-foreground">Snapplate · Last updated {UPDATED}</p>
      </header>

      <p>
        Snapplate is a small, private calorie-tracking app. It is not open to the public: only
        people the owner has invited can sign in. This page explains what the app stores and why.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">What we collect</h2>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Your Google account email address and name, used only to sign you in and check that you
            have been invited. We do not receive your Google password.
          </li>
          <li>
            What you enter: your body details (such as height, weight, age and goals), the meals,
            water, weight and exercise you log, and the photos of food you take.
          </li>
          <li>
            If you connect Apple Health through the optional Shortcut, the daily step count and
            active calories you choose to send.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">How it is used</h2>
        <ul className="ml-5 list-disc space-y-1">
          <li>To show your own data back to you and calculate your calorie and nutrition goals.</li>
          <li>
            When you scan a meal, the photo is sent to Google&apos;s Gemini AI service to estimate
            the food and its nutrition. It is used only to produce that result.
          </li>
        </ul>
        <p>We do not sell your data, show ads, or use it for marketing.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Where it is stored</h2>
        <p>
          Your data is stored with Supabase, protected so that each person can only read their own
          records. The app is hosted on Vercel. Photos are kept in a private storage area that only
          you can open.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Your choices</h2>
        <p>
          You can edit or delete your meals and logs inside the app. To have your account and all
          its data deleted, ask the person who invited you and it will be removed.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Health information</h2>
        <p>
          Snapplate gives general nutrition estimates, not medical advice. AI estimates can be
          wrong, so please check them and talk to a professional about any health decision.
        </p>
      </section>

      <p className="pt-2">
        <Link href="/login" className="text-sm font-medium underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
