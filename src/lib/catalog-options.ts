import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { parseList } from "./utils";
import { PRODUCT_CATALOG_TAG } from "./products";

export const BASE_SIZES = ["Free Size", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export const BASE_TAGS = ["new", "bestseller", "best rated"];

export const BASE_COLORS = [
  "Black",
  "White",
  "Red",
  "Maroon",
  "Wine",
  "Purple",
  "Violet",
  "Pink",
  "Gold",
  "Green",
  "Blue",
  "Navy",
  "Beige",
  "Cream",
  "Yellow",
  "Orange",
  "Grey",
  "Silver",
];

function mergeUnique(base: string[], extra: string[]): string[] {
  const seen = new Map<string, string>();
  for (const value of [...base, ...extra]) {
    const key = value.trim().toLowerCase();
    if (key && !seen.has(key)) seen.set(key, value.trim());
  }
  return Array.from(seen.values());
}

export async function getAvailableSizes(): Promise<string[]> {
  const products = await prisma.product.findMany({ select: { sizes: true } });
  const used = products.flatMap((p) => parseList(p.sizes));
  return mergeUnique(BASE_SIZES, used);
}

export async function getAvailableTags(): Promise<string[]> {
  const products = await prisma.product.findMany({ select: { tags: true } });
  const used = products.flatMap((p) => parseList(p.tags));
  return mergeUnique(BASE_TAGS, used);
}

export async function getAvailableColors(): Promise<string[]> {
  const products = await prisma.product.findMany({ select: { colors: true } });
  const used = products.flatMap((p) => parseList(p.colors));
  return mergeUnique(BASE_COLORS, used);
}

// The shop page asks for used colors and sizes on every visit even though
// they rarely change - cached across requests (not just within one) and only
// re-fetched when an admin product mutation calls revalidateTag.
const getUsedColumns = unstable_cache(
  async () => prisma.product.findMany({ select: { colors: true, sizes: true } }),
  ["used-colors-sizes"],
  { tags: [PRODUCT_CATALOG_TAG] }
);

/** Distinct colors actually used by products right now — for storefront filters. */
export async function getUsedColors(): Promise<string[]> {
  const products = await getUsedColumns();
  return mergeUnique([], products.flatMap((p) => parseList(p.colors))).sort();
}

/** Distinct sizes actually used by products right now — for storefront filters. */
export async function getUsedSizes(): Promise<string[]> {
  const products = await getUsedColumns();
  return mergeUnique([], products.flatMap((p) => parseList(p.sizes))).sort();
}
