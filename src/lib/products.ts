import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { parseList, parseImages } from "./utils";
import type { ProductFilters } from "@/types";
import type { Prisma } from "@prisma/client";

/** Tag used to invalidate everything derived from the product catalog
 * (price bounds, used colors/sizes) - admin product mutations call
 * revalidateTag(PRODUCT_CATALOG_TAG) instead of these re-querying every visit. */
export const PRODUCT_CATALOG_TAG = "product-catalog";
export const CATEGORIES_TAG = "categories";

/** Any of these tags (admins may type any phrasing) mark a product for the
 * "Best Rated" boost - matched case-insensitively. */
export const BEST_RATED_TAGS = ["bestseller", "best seller", "best rated"];

/** Stable-sorts products so any tagged with one of `tags` come first, keeping
 * the existing relative order within each group (so this layers on top of
 * whatever `orderBy` already produced, e.g. rating desc) - lets admins pin a
 * curated collection to the top without hiding the rest of the catalog. */
function boostByTags<T extends { tags: string }>(products: T[], tags: string[]): T[] {
  const wanted = new Set(tags.map((t) => t.toLowerCase()));
  return [...products].sort((a, b) => {
    const aTagged = parseList(a.tags).some((t) => wanted.has(t.toLowerCase())) ? 0 : 1;
    const bTagged = parseList(b.tags).some((t) => wanted.has(t.toLowerCase())) ? 0 : 1;
    return aTagged - bTagged;
  });
}

// These barely ever change between requests - cached indefinitely and only
// re-fetched when an admin mutation explicitly calls revalidateTag, instead
// of hitting the DB on every single page view.
export const getCategories = unstable_cache(
  async () => prisma.category.findMany({ where: { published: true }, orderBy: { name: "asc" } }),
  ["categories"],
  { tags: [CATEGORIES_TAG] }
);

export const getPriceBounds = unstable_cache(
  async () => {
    const agg = await prisma.product.aggregate({
      where: { published: true },
      _min: { price: true },
      _max: { price: true },
    });
    return {
      min: Math.floor(agg._min.price ?? 0),
      max: Math.ceil(agg._max.price ?? 10000),
    };
  },
  ["price-bounds"],
  { tags: [PRODUCT_CATALOG_TAG] }
);

// Snaps to a retail-style "...999" price point (999, 1999, 2999, ...) instead
// of a round quartile like 3000.
function snapTo999(value: number): number {
  return Math.max(999, Math.round(value / 1000) * 1000 - 1);
}

/** Four price bands spanning the catalog's actual min/max price, for the
 * homepage's "Shop by price" tiles - rebuilt from whatever's currently
 * published so the bands never point at an empty range, each carrying a
 * representative product photo from within that range. */
export const getPriceBands = unstable_cache(
  async () => {
    const { min, max } = await getPriceBounds();
    if (max <= min) return [];

    const range = max - min;
    const q1 = snapTo999(min + range * 0.25);
    let q2 = snapTo999(min + range * 0.5);
    let q3 = snapTo999(min + range * 0.75);
    if (q2 <= q1) q2 = q1 + 1000;
    if (q3 <= q2) q3 = q2 + 1000;

    const bands = [
      { label: `Under ₹${q1.toLocaleString("en-IN")}`, minPrice: undefined as number | undefined, maxPrice: q1 },
      { label: `₹${q1.toLocaleString("en-IN")} – ₹${q2.toLocaleString("en-IN")}`, minPrice: q1, maxPrice: q2 },
      { label: `₹${q2.toLocaleString("en-IN")} – ₹${q3.toLocaleString("en-IN")}`, minPrice: q2, maxPrice: q3 },
      { label: `Above ₹${q3.toLocaleString("en-IN")}`, minPrice: q3, maxPrice: undefined as number | undefined },
    ];

    return Promise.all(
      bands.map(async (band) => {
        const sample = await prisma.product.findFirst({
          where: { published: true, price: { gte: band.minPrice, lte: band.maxPrice } },
          orderBy: { createdAt: "desc" },
          select: { images: true },
        });
        return { ...band, image: sample ? parseImages(sample.images)[0] ?? null : null };
      })
    );
  },
  ["price-bands"],
  { tags: [PRODUCT_CATALOG_TAG] }
);

export async function getProducts(filters: ProductFilters) {
  const where: Prisma.ProductWhereInput = { published: true };

  // Every word of the search has to appear somewhere - name, description,
  // tags or category - in any order and any case, so "maroon belt" finds
  // "Maroon Silk Saree with Belt". A trailing "s" is dropped so plurals match
  // too ("sarees" finds "saree"); the shorter word is still contained in the
  // longer one, so this only ever widens what matches.
  const words = (filters.q ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((word) => (word.length > 3 && /s$/i.test(word) ? word.slice(0, -1) : word));
  if (words.length > 0) {
    where.AND = words.map((word) => ({
      OR: [
        { name: { contains: word, mode: "insensitive" } },
        { description: { contains: word, mode: "insensitive" } },
        { tags: { contains: word, mode: "insensitive" } },
        { category: { name: { contains: word, mode: "insensitive" } } },
      ],
    }));
  }

  if (filters.category) {
    where.category = { slug: filters.category, published: true };
  }

  if (filters.color) {
    where.colors = { contains: filters.color };
  }

  if (filters.size) {
    where.sizes = { contains: filters.size };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      gte: filters.minPrice ?? undefined,
      lte: filters.maxPrice ?? undefined,
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price-asc"
      ? { price: "asc" }
      : filters.sort === "price-desc"
      ? { price: "desc" }
      : filters.sort === "rating"
      ? { rating: "desc" }
      : { createdAt: "desc" };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: { category: true },
  });

  // Curated collections: tagging a product "new" or "bestseller" pins it to
  // the top of the New Arrivals / Best Rated views, without hiding the rest
  // of the catalog - the tag doesn't need special admin tooling to "publish"
  // a new collection, just a tag on whichever products belong in it.
  if (filters.tag) {
    return boostByTags(products, [filters.tag]);
  }
  if (filters.sort === "rating") {
    return boostByTags(products, BEST_RATED_TAGS);
  }

  return products;
}

// generateMetadata and the page body both need this for the same request -
// cache() dedupes the two calls down to a single DB round trip. Returns the
// product regardless of published state - the product page itself decides
// whether to show it (published only, same rule for everyone, admin included).
export const getProductBySlug = cache(async (slug: string) => {
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
});

export async function getRelatedProducts(categoryId: string, excludeId: string) {
  return prisma.product.findMany({
    where: { categoryId, id: { not: excludeId }, published: true },
    include: { category: true },
    take: 4,
  });
}

/** Every published product slug, for prerendering product pages as static
 * HTML at build time - drafts are deliberately excluded so they never get
 * built as public static pages before being published. New products (not
 * yet in this list) still render fine on-demand once published, and get
 * cached from then on, since `dynamicParams` defaults to true. */
export async function getAllProductSlugs() {
  const products = await prisma.product.findMany({ where: { published: true }, select: { slug: true } });
  return products.map((p) => p.slug);
}

export async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { featured: true, published: true },
    include: { category: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });
}

/** Top-rated products for the homepage - same rating-desc + bestseller-tag
 * boost as the shop page's "Best Rated" sort, just capped to a homepage-sized
 * row. */
export async function getBestRatedProducts() {
  const products = await prisma.product.findMany({
    where: { published: true },
    include: { category: true },
    orderBy: { rating: "desc" },
    take: 8,
  });
  return boostByTags(products, BEST_RATED_TAGS);
}

/** Products tagged "new" for the homepage's New Arrivals row - same tag the
 * shop page's "New Arrivals" view and the admin's badge both key off. Filters
 * with an exact tag match in JS (not a SQL `contains`) so a tag like
 * "renewed" can't false-positive match. */
export async function getNewArrivals() {
  const candidates = await prisma.product.findMany({
    where: { published: true, tags: { contains: "new" } },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 24,
  });
  return candidates.filter((p) => parseList(p.tags).some((t) => t.toLowerCase() === "new")).slice(0, 8);
}
