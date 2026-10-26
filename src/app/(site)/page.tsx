import { getCategories, getBestRatedProducts, getNewArrivals } from "@/lib/products";
import { getPublicHeroSlides, heroImages } from "@/lib/hero";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { CategoryTiles } from "@/components/shop/category-tiles";
import { ProductRailSection } from "@/components/shop/home-sections";

// Cached for up to 5 minutes; admin edits (hero, products, categories) call
// revalidatePath("/") to refresh it immediately instead of waiting that out.
export const revalidate = 300;

export default async function Home() {
  const [bestRated, newArrivals, categories, heroSlides] = await Promise.all([
    getBestRatedProducts(),
    getNewArrivals(),
    getCategories(),
    getPublicHeroSlides(),
  ]);

  return (
    <div>
      <HeroCarousel
        slides={heroSlides.map((s) => ({
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
        }))}
      />

      <ProductRailSection
        eyebrow="New Arrivals"
        title="New Collections"
        products={newArrivals}
        badges="new"
        href="/shop?tag=new"
        linkLabel="View All New Collections"
      />

      <ProductRailSection
        eyebrow="Best Seller"
        highlight
        title="Best Sellers"
        products={bestRated}
        badges="rank"
        layoutSwitch
        tone="cream"
        href="/shop?sort=rating"
        linkLabel="View All Best Sellers"
      />

      <CategoryTiles categories={categories} />
    </div>
  );
}
