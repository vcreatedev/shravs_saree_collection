import Image from "next/image";
import Link from "next/link";
import { getCategories, getFeaturedProducts } from "@/lib/products";
import { getHeroSlides, heroImages } from "@/lib/hero";
import { ProductCard } from "@/components/shop/product-card";
import { HeroCarousel } from "@/components/shop/hero-carousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, categories, heroSlides] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getHeroSlides(),
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

      {categories.length > 0 && (
        <section className="border-y hairline bg-paper py-14">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl italic">Shop by category</h2>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group relative flex aspect-square items-end overflow-hidden rounded-2xl bg-[#efe9db] p-5"
                >
                  {cat.image && (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(min-width: 640px) 25vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/0" />
                  <span className="relative font-display text-lg italic text-cream">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="flex items-end justify-between border-b hairline pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
                Curated for you
              </p>
              <h2 className="mt-1 font-display text-3xl italic">Featured pieces</h2>
            </div>
            <Link href="/shop" className="hidden text-sm font-medium hover:text-signal sm:block">
              View all →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-ink py-16 text-cream">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 md:grid-cols-3">
          {[
            { title: "Small-batch drops", body: "Limited runs, made to last, never overproduced." },
            { title: "Secure payments", body: "Checkout safely with Razorpay-powered payments." },
            { title: "Real human support", body: "Reach us on WhatsApp and get a reply same day." },
          ].map((item) => (
            <div key={item.title}>
              <p className="font-display text-xl italic text-signal">{item.title}</p>
              <p className="mt-2 text-sm text-cream/70">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
