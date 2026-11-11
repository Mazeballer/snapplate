/**
 * Mock mode: set NEXT_PUBLIC_MOCK=true to browse the UI on sample data with no sign-in and
 * no database. It exists for previewing screens and is hard-disabled on Vercel production
 * (next.config.ts also fails the build if both are set), so it can never open the real app.
 *
 * Next only inlines NEXT_PUBLIC_ variables into browser code when they are written out
 * literally, so each is referenced by its full name.
 */
const flag = process.env.NEXT_PUBLIC_MOCK === "true";
const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;

export const MOCK_MODE: boolean = flag && vercelEnv !== "production";

export const MOCK_USER = { id: "mock-user", email: "preview@snapplate.local" } as const;
