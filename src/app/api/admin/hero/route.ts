import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { heroSlideBodySchema, validateHeroLinks } from "@/lib/hero";

export async function POST(request: Request) {
  let body;
  try {
    body = heroSlideBodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid homepage section data." }, { status: 400 });
  }

  const linkError = await validateHeroLinks(body);
  if (linkError) return NextResponse.json({ error: linkError }, { status: 400 });

  const count = await prisma.homeHeroSlide.count();
  const slide = await prisma.homeHeroSlide.create({
    data: {
      order: count,
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
  return NextResponse.json({ slide });
}
