import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().min(1).max(2000),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional().nullable(),
  images: z.array(z.string().url()).min(1),
  stock: z.number().int().nonnegative(),
  categoryId: z.string(),
  featured: z.boolean().optional(),
  tags: z.string().optional(),
  colors: z.string().optional(),
  sizes: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try {
    body = productSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      price: body.price,
      compareAtPrice: body.compareAtPrice ?? null,
      images: JSON.stringify(body.images),
      stock: body.stock,
      categoryId: body.categoryId,
      featured: body.featured ?? false,
      tags: body.tags ?? "",
      colors: body.colors ?? "",
      sizes: body.sizes ?? "",
    },
  });

  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
