import { getCategories, getBestRatedProducts, getNewArrivals, getHeroSlides } from "@/lib/catalog";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { CategoryTiles } from "@/components/shop/category-tiles";
import { ProductRailSection } from "@/components/shop/home-sections";

// Refreshes when content is published in the Studio (app/api/revalidate), and
// at least every 5 minutes as a safety net.
export const revalidate = 300;

export default async function Home() {
  const [bestRated, newArrivals, categories, heroSlides] = await Promise.all([
    getBestRatedProducts(),
    getNewArrivals(),
    getCategories(),
    getHeroSlides(),
  ]);

  return (
    <div>
      <HeroCarousel slides={heroSlides} />

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
