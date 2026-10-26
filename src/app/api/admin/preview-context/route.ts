import { NextResponse } from "next/server";
import { getCategories, getRelatedProducts } from "@/lib/products";
import { getPublicHeroSlides, heroImages } from "@/lib/hero";

// Supplies the *rest* of the real page around whatever the admin is
// currently previewing - e.g. previewing one homepage section still needs
// the real categories/other hero sections around it, and
// previewing one product still needs its real "you may also like" list.
// Gated by proxy.ts along with the rest of /api/admin/*.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "hero") {
    const [categories, heroSlides] = await Promise.all([getCategories(), getPublicHeroSlides()]);
    return NextResponse.json({
      categories,
      heroSlides: heroSlides.map((s) => ({
        id: s.id,
        tagline: s.tagline,
        heading: s.heading,
        description: s.description,
        primaryLabel: s.primaryLabel,
        primaryHref: s.primaryHref,
        secondaryLabel: s.secondaryLabel ?? "",
        secondaryHref: s.secondaryHref ?? "",
        productHref: s.productHref ?? "",
        images: heroImages(s.images),
      })),
    });
  }

  if (type === "product") {
    const categoryId = searchParams.get("categoryId");
    const excludeId = searchParams.get("excludeId") ?? "";
    if (!categoryId) return NextResponse.json({ related: [] });
    const related = await getRelatedProducts(categoryId, excludeId);
    return NextResponse.json({ related });
  }

  if (type === "category") {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  }

  return NextResponse.json({ error: "Unknown preview type" }, { status: 400 });
}
