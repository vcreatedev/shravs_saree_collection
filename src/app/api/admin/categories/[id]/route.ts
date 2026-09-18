import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CATEGORIES_TAG } from "@/lib/products";

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
