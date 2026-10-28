import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { dataset, projectId } from "./env";

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/** A Sanity image address resized to a square - for icons and share pictures. */
export function squareImage(url: string, size: number, format: "png" | "jpg" = "png") {
  const sized = new URL(url);
  sized.searchParams.set("w", String(size));
  sized.searchParams.set("h", String(size));
  sized.searchParams.set("fit", "crop");
  sized.searchParams.set("fm", format);
  return sized.toString();
}

/** The logo as the picture shown when a link to the shop is shared. */
export function logoShareImages(logo: string, alt: string) {
  return logo ? [{ url: squareImage(logo, 800, "jpg"), width: 800, height: 800, alt }] : [];
}
