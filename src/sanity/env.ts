/* Which Sanity project and dataset the site reads. "production" is the live
   shop; local development uses "development" (set in .env.local), so test
   orders and test products never reach the live shop. */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "l6u3st01";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-02-01";
