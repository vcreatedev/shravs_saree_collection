import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export { metadata, viewport } from "next-sanity/studio";

/* The Sanity Studio: products, collections, homepage, pages, settings, and
   the Orders and Overview tools. Signing in uses the editor's Sanity account;
   only members of the project get in. */
export const dynamic = "force-static";

export default function AdminStudioPage() {
  return <NextStudio config={config} />;
}
