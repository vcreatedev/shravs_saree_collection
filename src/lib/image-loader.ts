"use client";

// Every image (photos and the logo) lives in Sanity, whose image CDN resizes,
// compresses and converts (to WebP/AVIF) on request - so images are asked for
// straight from it at the width they're shown, rather than also going through
// Next's own image optimizer (an extra hop and server invocation).
export default function sanityImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (src.startsWith("https://cdn.sanity.io/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    return url.toString();
  }
  // Anything else is served as it is; the width is added only so each
  // requested size has its own address.
  return `${src}?w=${width}`;
}
