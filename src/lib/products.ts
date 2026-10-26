import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { parseList, BEST_RATED_TAGS } from "./utils";
import type { ProductFilters, ProductSort } from "@/types";
import type { Prisma } from "@prisma/client";

/** Tag used to invalidate everything derived from the product catalog
 * (price bounds, used colors/sizes) - admin product mutations call
 * revalidateTag(PRODUCT_CATALOG_TAG) instead of these re-querying every visit. */
export const PRODUCT_CATALOG_TAG = "product-catalog";
export const CATEGORIES_TAG = "categories";

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

/** How each shop sort orders the catalog. "featured" puts the products
 * marked Featured in admin first, newest first within each group. */
const PRODUCT_ORDER: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ featured: "desc" }, { createdAt: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
  newest: [{ createdAt: "desc" }],
  "name-asc": [{ name: "asc" }],
  "name-desc": [{ name: "desc" }],
  rating: [{ rating: "desc" }],
};

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

  // An unknown sort value (it comes straight from the URL) falls back to newest.
  const orderBy = PRODUCT_ORDER[filters.sort ?? "newest"] ?? PRODUCT_ORDER.newest;

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

const RELATED_LIMIT = 8;

/** "Similar products" for a product page: up to 8 others, newest first from
 * its own category, then topped up with the newest from the rest of the
 * catalog so a small category still fills the row. */
export async function getRelatedProducts(categoryId: string, excludeId: string) {
  const sameCategory = await prisma.product.findMany({
    where: { categoryId, id: { not: excludeId }, published: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: RELATED_LIMIT,
  });
  if (sameCategory.length >= RELATED_LIMIT) return sameCategory;
  const others = await prisma.product.findMany({
    where: { categoryId: { not: categoryId }, id: { not: excludeId }, published: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: RELATED_LIMIT - sameCategory.length,
  });
  return [...sameCategory, ...others];
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
