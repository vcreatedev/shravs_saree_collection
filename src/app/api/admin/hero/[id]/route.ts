import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { heroSlideBodySchema, validateHeroLinks } from "@/lib/hero";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try {
    body = heroSlideBodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid homepage section data." }, { status: 400 });
  }

  const linkError = await validateHeroLinks(body);
  if (linkError) return NextResponse.json({ error: linkError }, { status: 400 });

  const slide = await prisma.homeHeroSlide.update({
    where: { id },
    data: {
      tagline: body.tagline,
      heading: body.heading,
      description: body.description,
      primaryLabel: body.primaryLabel,
      primaryHref: body.primaryHref,
      secondaryLabel: body.secondaryLabel || null,
      secondaryHref: body.secondaryHref || null,
      productHref: body.productHref || null,
      images: body.images,
    },
  });

  revalidatePath("/");
  return NextResponse.json({ slide });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.homeHeroSlide.delete({ where: { id } });
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
