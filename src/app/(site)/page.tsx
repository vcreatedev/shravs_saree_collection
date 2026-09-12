import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getCategories, getFeaturedProducts } from "@/lib/products";
import { ProductCard } from "@/components/shop/product-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <div>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-6 lg:pt-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-signal">
            The autumn edit is here
          </p>
          <h1 className="mt-4 font-display text-5xl italic leading-[1.05] sm:text-6xl lg:text-6xl">
            Objects for a
            <br /> considered life.
          </h1>
          <p className="mt-6 max-w-md text-ink-soft">
            Small-batch apparel, home goods and accessories — sourced from makers who care about
            craft as much as you do.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal"
            >
              Shop the collection
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/shop?sort=rating"
              className="text-sm font-medium underline decoration-line underline-offset-4 hover:decoration-signal"
            >
              See best rated
            </Link>
          </div>
        </div>

        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl bg-[#efe9db] lg:aspect-[6/5]">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
            alt="Considered objects styled on a warm backdrop"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

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
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
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
