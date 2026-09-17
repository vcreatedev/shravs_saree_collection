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

export function parseColorVariants(value: unknown): ColorVariant[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => ({
      color: typeof v.color === "string" ? v.color : "",
      images: Array.isArray(v.images) ? v.images.filter((i): i is string => typeof i === "string") : [],
      price: typeof v.price === "number" && Number.isFinite(v.price) ? v.price : null,
    }))
    .filter((v) => v.color);
}

/** The price to charge for a given color: that color's override if set, else the base price. */
export function effectivePrice(basePrice: number, variants: ColorVariant[], color?: string): number {
  if (!color) return basePrice;
  const variant = variants.find((v) => v.color === color);
  return variant?.price ?? basePrice;
}

/** The gallery to show for a given color: that color's photos if any were uploaded, else the base gallery. */
export function imagesForColor(baseImages: string[], variants: ColorVariant[], color?: string): string[] {
  if (!color) return baseImages;
  const variant = variants.find((v) => v.color === color);
  return variant && variant.images.length > 0 ? variant.images : baseImages;
}
