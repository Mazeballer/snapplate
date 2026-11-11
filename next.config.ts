import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

// Mock mode skips sign-in. Refuse to build a production deployment with it switched on.
if (process.env.NEXT_PUBLIC_MOCK === "true" && process.env.VERCEL_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_MOCK=true is not allowed on a production deployment. Remove it from the Vercel production environment variables.",
  );
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSerwist(nextConfig);
