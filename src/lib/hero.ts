import { z } from "zod";
import { prisma } from "./prisma";

export const heroSlideBodySchema = z.object({
  tagline: z.string().min(1).max(120),
  heading: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  primaryLabel: z.string().min(1).max(60),
  primaryHref: z.string().min(1),
  secondaryLabel: z.string().max(60).optional().or(z.literal("")),
  secondaryHref: z.string().optional().or(z.literal("")),
  productHref: z.string().optional().or(z.literal("")),
  images: z.array(z.string().url()).min(1),
});

export type HeroSlideBody = z.infer<typeof heroSlideBodySchema>;

/** Throws-free validation of a slide's chosen links against the real,
 * currently-existing site pages/products - returns an error string, or null
 * if valid. */
export async function validateHeroLinks(body: HeroSlideBody): Promise<string | null> {
  const validHrefs = new Set((await getSiteLinks()).map((l) => l.href));
  if (!validHrefs.has(body.primaryHref)) return "Choose a valid primary link.";
  if (body.secondaryHref && !validHrefs.has(body.secondaryHref)) return "Choose a valid secondary link.";
  if (body.productHref) {
    const validProductHrefs = new Set((await getProductLinks()).map((l) => l.href));
    if (!validProductHrefs.has(body.productHref)) return "Choose a valid product.";
  }
  return null;
}

const DEFAULT_IMAGES = [
  "https://res.cloudinary.com/cklit2yc/image/upload/shravs-saree-collections/silk-sarees/wine-chevron-silk-saree-2.jpg",
];

export async function getHeroSlides() {
  const slides = await prisma.homeHeroSlide.findMany({ orderBy: { order: "asc" } });
  if (slides.length > 0) return slides;
  const seeded = await prisma.homeHeroSlide.create({ data: { order: 0, images: DEFAULT_IMAGES } });
  return [seeded];
}

export function heroImages(images: unknown): string[] {
  if (Array.isArray(images)) return images.filter((i): i is string => typeof i === "string");
  return [];
}

export type SiteLink = { label: string; href: string };

/** Real, navigable pages on the site - the only hrefs a hero slide's buttons
 * may point to, so admins pick from what actually exists instead of typing a
 * URL that could 404. */
export async function getSiteLinks(): Promise<SiteLink[]> {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return [
    { label: "Home", href: "/" },
    { label: "Shop — All products", href: "/shop" },
    { label: "Shop — New Arrivals", href: "/shop?tag=new" },
    { label: "Shop — Best Rated", href: "/shop?sort=rating" },
    ...categories.map((c) => ({ label: `Shop — ${c.name}`, href: `/shop?category=${c.slug}` })),
  ];
}

/** Existing products a hero slide's image may link to directly. */
export async function getProductLinks(): Promise<SiteLink[]> {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { name: true, slug: true },
  });
  return products.map((p) => ({ label: p.name, href: `/product/${p.slug}` }));
}
