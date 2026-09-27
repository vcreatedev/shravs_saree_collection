import { getHeroSlides, getSiteLinks, getProductLinks, heroImages } from "@/lib/hero";
import { HeroSlidesManager } from "@/components/admin/hero-slides-manager";

export const metadata = { title: "Homepage" };
export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  const [slides, linkOptions, productOptions] = await Promise.all([
    getHeroSlides(),
    getSiteLinks(),
    getProductLinks(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl italic">Homepage</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Controls the banner at the top of the storefront homepage. Each section is one slide of
        the carousel, with its own photos and text. For one slide per category, add a section for
        each (e.g. Sarees, then Readymade Blouses), and point its button at that category under
        &ldquo;Primary button links to&rdquo;. Only published sections show on the homepage.
      </p>
      <div className="mt-6 max-w-2xl">
        <HeroSlidesManager
          slides={slides.map((s) => ({
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
            published: s.published,
          }))}
          linkOptions={linkOptions}
          productOptions={productOptions}
        />
      </div>
    </div>
  );
}
