import { prisma } from "./prisma";
import { parseList } from "./utils";
import type { ProductFilters } from "@/types";
import type { Prisma } from "@prisma/client";

/** Stable-sorts products so any tagged with `tag` come first, keeping the
 * existing relative order within each group (so this layers on top of
 * whatever `orderBy` already produced) - lets admins pin a curated "new" or
 * "bestseller" collection to the top without hiding the rest of the catalog. */
function boostByTag<T extends { tags: string }>(products: T[], tag: string): T[] {
  return [...products].sort((a, b) => {
    const aTagged = parseList(a.tags).includes(tag) ? 0 : 1;
    const bTagged = parseList(b.tags).includes(tag) ? 0 : 1;
    return aTagged - bTagged;
  });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getPriceBounds() {
  const agg = await prisma.product.aggregate({
    _min: { price: true },
    _max: { price: true },
  });
  return {
    min: Math.floor(agg._min.price ?? 0),
    max: Math.ceil(agg._max.price ?? 10000),
  };
}

export async function getProducts(filters: ProductFilters) {
  const where: Prisma.ProductWhereInput = {};

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { description: { contains: filters.q } },
      { tags: { contains: filters.q } },
    ];
  }

  if (filters.category) {
    where.category = { slug: filters.category };
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
    return boostByTag(products, filters.tag);
  }
  if (filters.sort === "rating") {
    return boostByTag(products, "bestseller");
  }

  return products;
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
}

export async function getRelatedProducts(categoryId: string, excludeId: string) {
  return prisma.product.findMany({
    where: { categoryId, id: { not: excludeId } },
    include: { category: true },
    take: 4,
  });
}

export async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { featured: true },
    include: { category: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });
}
