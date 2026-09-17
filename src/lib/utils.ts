import type { ColorVariant } from "@/types";

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LUM-${ts}-${rand}`;
}

export function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [images];
  } catch {
    return images ? [images] : [];
  }
}

export function parseList(value: string): string[] {
  return value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
}

export function parseSizeStock(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const num = Number(val);
    if (key && Number.isFinite(num)) result[key] = Math.max(0, Math.trunc(num));
  }
  return result;
}

function asNullableString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNullableNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function parseColorVariants(value: unknown): ColorVariant[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => ({
      color: typeof v.color === "string" ? v.color : "",
      images: Array.isArray(v.images) ? v.images.filter((i): i is string => typeof i === "string") : [],
      name: asNullableString(v.name),
      description: asNullableString(v.description),
      price: asNullableNumber(v.price),
      compareAtPrice: asNullableNumber(v.compareAtPrice),
      sizes: asNullableString(v.sizes),
      sizeStock: v.sizeStock ? parseSizeStock(v.sizeStock) : null,
    }))
    .filter((v) => v.color);
}

function findVariant(variants: ColorVariant[], color?: string): ColorVariant | undefined {
  if (!color) return undefined;
  return variants.find((v) => v.color === color);
}

/** The gallery to show for a given color: that color's photos if any were uploaded, else the base gallery. */
export function imagesForColor(baseImages: string[], variants: ColorVariant[], color?: string): string[] {
  const variant = findVariant(variants, color);
  return variant && variant.images.length > 0 ? variant.images : baseImages;
}

/** The display name for a given color: that color's override if set, else the base name. */
export function nameForColor(baseName: string, variants: ColorVariant[], color?: string): string {
  return findVariant(variants, color)?.name ?? baseName;
}

/** The description for a given color: that color's override if set, else the base description. */
export function descriptionForColor(baseDescription: string, variants: ColorVariant[], color?: string): string {
  return findVariant(variants, color)?.description ?? baseDescription;
}

/** The price to charge for a given color: that color's override if set, else the base price. */
export function effectivePrice(basePrice: number, variants: ColorVariant[], color?: string): number {
  return findVariant(variants, color)?.price ?? basePrice;
}

/** The compare-at price for a given color: that color's override if set, else the base compare-at price. */
export function compareAtPriceForColor(
  baseCompareAtPrice: number | null,
  variants: ColorVariant[],
  color?: string
): number | null {
  const variant = findVariant(variants, color);
  if (!variant) return baseCompareAtPrice;
  return variant.compareAtPrice !== null ? variant.compareAtPrice : baseCompareAtPrice;
}

/** The size list for a given color: that color's override if set, else the base sizes. */
export function sizesForColor(baseSizes: string[], variants: ColorVariant[], color?: string): string[] {
  const variant = findVariant(variants, color);
  if (!variant || variant.sizes === null) return baseSizes;
  return parseList(variant.sizes);
}

/** The per-size stock map for a given color: that color's override if set, else the base size stock. */
export function sizeStockForColor(
  baseSizeStock: Record<string, number>,
  variants: ColorVariant[],
  color?: string
): Record<string, number> {
  const variant = findVariant(variants, color);
  if (!variant || variant.sizeStock === null) return baseSizeStock;
  return variant.sizeStock;
}
