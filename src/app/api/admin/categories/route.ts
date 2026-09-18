import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const bodySchema = z.object({
  name: z.string().min(2).max(80),
  image: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid category data." }, { status: 400 });
  }

  const baseSlug = slugify(body.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const category = await prisma.category.create({
    data: { name: body.name, slug, image: body.image || null },
  });

  revalidatePath("/");
  revalidatePath("/shop");
  return NextResponse.json({ category });
}
