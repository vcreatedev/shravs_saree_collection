import Image from "next/image";
import Link from "next/link";
import { Truck, ShieldCheck, MessageCircle } from "lucide-react";
import { getCategories, getFeaturedProducts, getBestRatedProducts, getNewArrivals, getPriceBands } from "@/lib/products";
import { getPublicHeroSlides, heroImages } from "@/lib/hero";
import { ProductCard } from "@/components/shop/product-card";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { CategoryTiles } from "@/components/shop/category-tiles";
import { FeaturedRotator } from "@/components/shop/featured-rotator";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";

// Cached for up to 5 minutes; admin edits (hero, products, categories) call
// revalidatePath("/") to refresh it immediately instead of waiting that out.
export const revalidate = 300;

const TRUST_ITEMS = [
  { icon: Truck, title: "Small-batch drops", body: "Limited runs, made to last, never overproduced." },
  { icon: ShieldCheck, title: "Secure payments", body: "Checkout safely with Razorpay-powered payments." },
  { icon: MessageCircle, title: "Real human support", body: "Reach us on WhatsApp and get a reply same day." },
];

export default async function Home() {
  const [featured, bestRated, newArrivals, priceBands, categories, heroSlides] = await Promise.all([
    getFeaturedProducts(),
    getBestRatedProducts(),
    getNewArrivals(),
    getPriceBands(),
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

      <CategoryTiles categories={categories} />

      {newArrivals.length > 0 && (
        <section className="bg-jaali py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <div className="flex items-end justify-between gap-4 border-b hairline pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Just landed</p>
                  <h2 className="mt-1 font-display text-3xl italic">New arrivals</h2>
                  <span className="mt-3 block h-px w-12 bg-gold/60" />
                </div>
                <Link href="/shop?tag=new" className="hidden text-sm font-medium hover:text-signal sm:block">
                  View all →
                </Link>
              </div>
            </Reveal>
            <StaggerGroup className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {newArrivals.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="bg-velvet py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <div className="flex items-end justify-between gap-4 border-b hairline pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
                    Curated for you
                  </p>
                  <h2 className="mt-1 font-display text-3xl italic">Featured pieces</h2>
                  <span className="mt-3 block h-px w-12 bg-gold/60" />
                </div>
                <Link href="/shop" className="hidden text-sm font-medium hover:text-signal sm:block">
                  View all →
                </Link>
              </div>
            </Reveal>
            {/* One piece runs large across two columns/rows - a curated
                spotlight rather than another repeat of the New Arrivals
                layout - and every featured piece takes a turn in it. */}
            <FeaturedRotator products={featured} />
          </div>
        </section>
      )}

      {bestRated.length > 0 && (
        <section className="bg-jaali py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <div className="flex items-end justify-between gap-4 border-b hairline pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
                    Loved by shoppers
                  </p>
                  <h2 className="mt-1 font-display text-3xl italic">Best rated</h2>
                  <span className="mt-3 block h-px w-12 bg-gold/60" />
                </div>
                <Link href="/shop?sort=rating" className="hidden text-sm font-medium hover:text-signal sm:block">
                  View all →
                </Link>
              </div>
            </Reveal>
            <StaggerGroup className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {bestRated.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}

      {priceBands.length > 0 && (
        <section className="bg-velvet py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <Reveal>
              <div className="text-center">
                <h2 className="font-display text-2xl italic">Shop by price</h2>
                <span className="mx-auto mt-3 block h-px w-12 bg-gold/60" />
              </div>
            </Reveal>
            <StaggerGroup className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {priceBands.map((band) => {
                const params = new URLSearchParams();
                if (band.minPrice !== undefined) params.set("minPrice", String(band.minPrice));
                if (band.maxPrice !== undefined) params.set("maxPrice", String(band.maxPrice));
                return (
                  <StaggerItem key={band.label}>
                    <Link
                      href={`/shop?${params.toString()}`}
                      className="group flex flex-col items-center overflow-hidden rounded-2xl border hairline bg-paper pb-5 pt-6 text-center transition-colors hover:border-ink"
                    >
                      <span className="font-display text-lg italic sm:text-xl">{band.label}</span>
                      <span className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-soft group-hover:text-signal">
                        Shop now →
                      </span>
                      <div className="relative mt-5 aspect-[3/4] w-4/5 overflow-hidden rounded-t-full bg-surface">
                        {band.image && (
                          <Image
                            src={band.image}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 25vw, 50vw"
                            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </div>
        </section>
      )}

      <section className="bg-jaali-band py-16 text-band-fg">
        <StaggerGroup className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 md:grid-cols-3">
          {TRUST_ITEMS.map((item) => (
            <StaggerItem key={item.title} className="flex items-start gap-4">
              <item.icon className="h-8 w-8 flex-shrink-0 text-gold" strokeWidth={1.5} />
              <div>
                <p className="font-display text-xl italic text-signal">{item.title}</p>
                <p className="mt-2 text-sm text-band-fg/70">{item.body}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>
    </div>
  );
}
