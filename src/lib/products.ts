import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { parseList } from "./utils";
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

export async function getProducts(filters: ProductFilters) {
  const where: Prisma.ProductWhereInput = { published: true };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { description: { contains: filters.q } },
      { tags: { contains: filters.q } },
    ];
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
