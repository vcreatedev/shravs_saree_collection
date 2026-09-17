import { prisma } from "./prisma";
import type { ProductFilters } from "@/types";
import type { Prisma } from "@prisma/client";

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

  if (filters.tag) {
    where.tags = { contains: filters.tag };
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

  return prisma.product.findMany({
    where,
    orderBy,
    include: { category: true },
  });
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
