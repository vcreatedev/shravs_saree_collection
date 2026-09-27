import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CATEGORIES_TAG } from "@/lib/products";
import type { Prisma } from "@prisma/client";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  image: z.string().url().optional().or(z.literal("")),
  image2: z.string().url().optional().or(z.literal("")),
  published: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid category data." }, { status: 400 });
  }

  const data: Prisma.CategoryUpdateInput = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.image !== undefined) data.image = body.image || null;
  if (body.image2 !== undefined) data.image2 = body.image2 || null;
  if (body.published !== undefined) data.published = body.published;

  const category = await prisma.category.update({ where: { id }, data });
  revalidatePath("/");
  revalidatePath("/shop");
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${productCount} product(s) still use this category.` },
      { status: 409 }
    );
  }
  await prisma.category.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/shop");
  revalidateTag(CATEGORIES_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
