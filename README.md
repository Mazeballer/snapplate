# Snapplate

A private, mobile-first calorie tracker you install on your phone as a PWA. Snap a photo of your plate and AI estimates the calories and macros.

## Stack

- Next.js 16 (App Router, Cache Components) and TypeScript
- shadcn/ui (Base UI) and Tailwind CSS 4
- Supabase: Postgres with row-level security, Google sign-in, private photo storage
- Gemini for food photo analysis (server side only)
- Serwist service worker for the installable offline shell
- pnpm and Vitest

## How access works

Snapplate is private. Sign-in is Google only, and only emails in the `allowed_emails` table can use it. This is enforced in three places: a Supabase "Before User Created" hook blocks new sign-ups, every table's row-level security re-checks the allowlist, and the server re-checks on each page load.

All dates and times use Malaysia time (Asia/Kuala_Lumpur) through `lib/time.ts`.

## Setup

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and keys and your Gemini key.
3. Create a Supabase project, then run `supabase link --project-ref <ref>` and `supabase db push` to create the tables, policies and photo bucket.
4. Add allowed emails to the `allowed_emails` table in the Supabase dashboard.
5. In Supabase, enable the Before User Created hook (`public.hook_before_user_created`) and the Google provider, and set the Site URL and redirect URLs.
6. Run `pnpm dev` and open http://localhost:3000.

## Scripts

- `pnpm dev` starts the dev server (the service worker is off in dev).
- `pnpm build` then `pnpm start` runs the production build, where the PWA install and offline behaviour can be tested.
- `pnpm test` runs the unit tests, `pnpm lint` runs ESLint.
- `node scripts/generate-icons.mjs` regenerates the app icons.

## Status

Done: PWA shell, Malaysia-time and nutrition logic with tests, database schema and security rules, Google sign-in with the allowlist gate. Next: onboarding, meal logging, AI photo scan, progress, Apple Health sync via an iOS Shortcut.
