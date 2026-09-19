"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { ProductCard } from "@/components/shop/product-card";
import { HeroCarousel } from "@/components/shop/hero-carousel";
import { CategoryTiles } from "@/components/shop/category-tiles";
import type { ProductWithCategory } from "@/types";
import type { Category } from "@prisma/client";

type HeroSlideData = {
  id: string;
  tagline: string;
  heading: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  productHref: string;
  images: string[];
};

type CategoryTile = Pick<Category, "id" | "name" | "slug" | "image">;

type PreviewPayload =
  | { type: "product"; published: boolean; data: ProductWithCategory }
  | { type: "hero"; published: boolean; data: HeroSlideData }
  | { type: "category"; published: boolean; data: CategoryTile };

type HeroContext = { categories: Category[]; featured: ProductWithCategory[]; heroSlides: HeroSlideData[] };
type ProductContext = { related: ProductWithCategory[] };
type CategoryContext = { categories: CategoryTile[]; featured: ProductWithCategory[] };

const STORAGE_KEY = "adminPreview";
const emptySubscribe = () => () => {};

// useSyncExternalStore requires getSnapshot to return a stable reference
// when nothing has changed - sessionStorage.getItem/JSON.parse would
// otherwise build a brand-new object on every call and look like an
// infinite stream of "new" values. The preview data is set once (right
// before this tab opens) and never changes while it's open, so reading and
// parsing it exactly once and caching that result is correct here.
let cached: PreviewPayload | "empty" | undefined;

function readPreviewPayload(): PreviewPayload | "empty" | "loading" {
  if (cached === undefined) {
    let parsed: PreviewPayload | "empty";
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      parsed = raw ? JSON.parse(raw) : "empty";
    } catch {
      parsed = "empty";
    }
    cached = parsed;
  }
  return cached;
}

function StatusBar({ published }: { published: boolean | null }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide ${
        published ? "bg-forest text-cream" : "bg-gold/20 text-ink"
      }`}
    >
      <p>
        Preview — only visible to you, nothing is saved
        {published !== null &&
          (published ? " · Published (this is what shoppers will see)" : " · Draft (hidden from shoppers)")}
      </p>
      <Link href="/admin" aria-label="Back to admin" className="rounded-full border border-current p-1.5 hover:opacity-70">
        <X className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default function PreviewPage() {
  const payload = useSyncExternalStore(emptySubscribe, readPreviewPayload, () => "loading" as const);
  const ready = payload !== "empty" && payload !== "loading";

  if (payload === "loading") return null;

  if (payload === "empty") {
    return (
      <div className="min-h-screen bg-cream">
        <StatusBar published={null} />
        <div className="mx-auto max-w-lg px-5 py-24 text-center">
          <p className="font-display text-xl italic">Nothing to preview</p>
          <p className="mt-2 text-sm text-ink-soft">
            Go back to the admin panel and click Preview again from there.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <StatusBar published={ready ? payload.published : null} />
      {payload.type === "hero" ? (
        <HeroPreview payload={payload} />
      ) : payload.type === "product" ? (
        <ProductPreview payload={payload} />
      ) : (
        <CategoryPreview payload={payload} />
      )}
    </div>
  );
}

function HeroPreview({ payload }: { payload: { published: boolean; data: HeroSlideData } }) {
  const [context, setContext] = useState<HeroContext | null>(null);

  useEffect(() => {
    fetch("/api/admin/preview-context?type=hero")
      .then((r) => r.json())
      .then(setContext)
      .catch(() => setContext({ categories: [], featured: [], heroSlides: [] }));
  }, []);

  if (!context) return null;

  // The real homepage's hero carousel, with this one section swapped for the
  // current unsaved edit - present if published, absent if not, exactly
  // like it would behave for real once saved.
  const otherSlides = context.heroSlides.filter((s) => s.id !== payload.data.id);
  const heroSlides = payload.published ? [...otherSlides, payload.data] : otherSlides;

  return (
    <div>
      <SiteHeader />

      <HeroCarousel slides={heroSlides} />

      <CategoryTiles categories={context.categories} />

      {context.featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="flex items-end justify-between border-b hairline pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Curated for you</p>
              <h2 className="mt-1 font-display text-3xl italic">Featured pieces</h2>
            </div>
            <Link href="/shop" className="hidden text-sm font-medium hover:text-signal sm:block">
              View all →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {context.featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="bg-band py-16 text-band-fg">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 md:grid-cols-3">
          {[
            { title: "Small-batch drops", body: "Limited runs, made to last, never overproduced." },
            { title: "Secure payments", body: "Checkout safely with Razorpay-powered payments." },
            { title: "Real human support", body: "Reach us on WhatsApp and get a reply same day." },
          ].map((item) => (
            <div key={item.title}>
              <p className="font-display text-xl italic text-signal">{item.title}</p>
              <p className="mt-2 text-sm text-band-fg/70">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ProductPreview({ payload }: { payload: { published: boolean; data: ProductWithCategory } }) {
  const [context, setContext] = useState<ProductContext | null>(null);
  const product = payload.data;

  useEffect(() => {
    const params = new URLSearchParams({ type: "product", categoryId: product.categoryId, excludeId: product.id });
    fetch(`/api/admin/preview-context?${params}`)
      .then((r) => r.json())
      .then(setContext)
      .catch(() => setContext({ related: [] }));
  }, [product.categoryId, product.id]);

  return (
    <div>
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {payload.published ? (
          <div className="grid gap-12 lg:grid-cols-2">
            <ProductPurchase product={product} previewOnly />
          </div>
        ) : (
          <div className="rounded-2xl border hairline bg-paper px-6 py-16 text-center">
            <p className="font-display text-xl italic">Not published</p>
            <p className="mt-2 text-sm text-ink-soft">
              This product is still a draft - shoppers get a 404 here until you check Published.
            </p>
          </div>
        )}

        {context && context.related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display text-2xl italic">You may also like</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {context.related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function CategoryPreview({ payload }: { payload: { published: boolean; data: CategoryTile } }) {
  const [context, setContext] = useState<CategoryContext | null>(null);

  useEffect(() => {
    fetch("/api/admin/preview-context?type=category")
      .then((r) => r.json())
      .then(setContext)
      .catch(() => setContext({ categories: [], featured: [] }));
  }, []);

  if (!context) return null;

  // The real homepage's category tile row, with this one category swapped in
  // for the current unsaved edit - present if published, absent if not,
  // exactly like it would behave for real once saved.
  const otherCategories = context.categories.filter((c) => c.id !== payload.data.id);
  const categories = payload.published ? [...otherCategories, payload.data] : otherCategories;

  return (
    <div>
      <SiteHeader />

      <CategoryTiles categories={categories} />

      {!payload.published && (
        <div className="mx-auto max-w-lg px-5 py-10 text-center">
          <p className="text-sm text-ink-soft">
            This category is still a draft — shoppers won&apos;t see its tile here or be able to
            filter by it in the shop until you check Published.
          </p>
        </div>
      )}

      {context.featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="flex items-end justify-between border-b hairline pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Curated for you</p>
              <h2 className="mt-1 font-display text-3xl italic">Featured pieces</h2>
            </div>
            <Link href="/shop" className="hidden text-sm font-medium hover:text-signal sm:block">
              View all →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {context.featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
