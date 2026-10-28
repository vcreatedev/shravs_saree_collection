import { getSiteSettings } from "@/lib/catalog";
import { squareImage } from "@/sanity/image";

/* Browsers and crawlers that ask for /favicon.ico directly, instead of
   reading the page's icon links, are sent to the logo from the Studio. */
export async function GET() {
  const { logo } = await getSiteSettings();
  if (!logo) return new Response(null, { status: 404 });
  return Response.redirect(squareImage(logo, 48), 307);
}
