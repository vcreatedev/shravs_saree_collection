import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { PRODUCT_CATALOG_TAG } from "@/lib/products";

const productSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().min(1).max(2000),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional().nullable(),
  images: z.array(z.string().url()).min(1),
  stock: z.number().int().nonnegative(),
  categoryId: z.string(),
  featured: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  tags: z.string().optional(),
  colors: z.string().optional(),
  sizes: z.string().optional(),
  sizeStock: z.record(z.string(), z.number().int().nonnegative()).optional().nullable(),
  colorVariants: z
    .array(
      z.object({
        color: z.string(),
        images: z.array(z.string().url()),
        name: z.string().nullable(),
        description: z.string().nullable(),
        price: z.number().positive().nullable(),
        compareAtPrice: z.number().positive().nullable(),
        sizes: z.string().nullable(),
        sizeStock: z.record(z.string(), z.number().int().nonnegative()).nullable(),
        tags: z.string().nullable(),
        rating: z.number().min(0).max(5).nullable(),
      })
    )
    .optional()
    .nullable(),
});

export async function POST(request: Request) {
  let body;
  try {
    body = productSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json({ error: "Invalid product data.", details: `${error}` }, { status: 400 });
  }

  const baseSlug = slugify(body.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      description: body.description,
      price: body.price,
      compareAtPrice: body.compareAtPrice ?? null,
      images: JSON.stringify(body.images),
      stock: body.stock,
      categoryId: body.categoryId,
      featured: body.featured ?? false,
      rating: body.rating ?? 4.5,
      tags: body.tags ?? "",
      colors: body.colors ?? "",
      sizes: body.sizes ?? "",
      sizeStock: body.sizeStock ?? Prisma.JsonNull,
      colorVariants: body.colorVariants ?? Prisma.JsonNull,
    },
  });

  revalidatePath("/");
  revalidatePath("/shop");
  revalidateTag(PRODUCT_CATALOG_TAG, { expire: 0 });
  return NextResponse.json({ product });
}
