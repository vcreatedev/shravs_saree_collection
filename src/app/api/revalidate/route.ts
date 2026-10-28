import { revalidateTag } from "next/cache";
import { parseBody } from "next-sanity/webhook";
import type { NextRequest } from "next/server";
import { CONTENT_TAG } from "@/lib/catalog";

/* Sanity calls this when content is published, changed or deleted: a GROQ
   webhook (sanity.io/manage → API → Webhooks) signed with
   SANITY_REVALIDATE_SECRET. It marks the site's Sanity content outdated, so
   each page fetches fresh content on its next visit; between publishes pages
   are served from cache. parseBody waits 3s so the new content is ready. */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return new Response("Refresh on publish isn't set up: add SANITY_REVALIDATE_SECRET.", { status: 501 });
  }

  const { isValidSignature, body } = await parseBody<{ _type?: string }>(request, secret);
  if (!isValidSignature) return new Response("Invalid signature", { status: 401 });

  // expire 0: the next visitor gets the new content, not one more view of the old page.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return Response.json({ revalidated: true, type: body?._type ?? null });
}
