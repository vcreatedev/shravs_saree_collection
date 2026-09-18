import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PRODUCT_CATALOG_TAG } from "@/lib/products";

const schema = z.object({ published: z.boolean() });

// A lightweight sibling to PATCH /api/admin/products/[id] (which requires
// the full edit form's payload) - just for the listing page's quick
// Publish/Unpublish toggle, without needing the whole product loaded there.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const product = await prisma.product.update({ where: { id }, data: { published: body.published } });

  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/product/${product.slug}`);
  revalidateTag(PRODUCT_CATALOG_TAG, { expire: 0 });
  return NextResponse.json({ product });
}
