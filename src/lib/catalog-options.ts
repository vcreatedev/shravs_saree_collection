import { prisma } from "./prisma";
import { parseList } from "./utils";

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
