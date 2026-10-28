import { defineCliConfig } from "sanity/cli";

/* For the Sanity command line (datasets, tokens, typegen). The Studio itself
   runs inside the site at /admin. */
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "l6u3st01",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  },
});
