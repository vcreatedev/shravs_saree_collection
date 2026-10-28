"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Package, ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getSwatchColor } from "@/lib/color-swatches";
import type { Product } from "@/types";
import { COLLECTION_PARAM, productHref, useQuickAdd, type ProductCollection } from "./product-card";

// How far one arrow press scrolls the row.
const ARROW_STEP_PX = 320;
// Swatches shown before the rest collapse into "+N".
const MAX_SWATCHES = 4;
// One position dot for every two cards.
const CARDS_PER_DOT = 2;
// The row always holds at least this many cards; a shorter list repeats
// to fill it.
const MIN_CARDS = 8;

const ARROW_CLASS =
  "absolute top-1/2 z-10 -translate-y-1/2 rounded-full border border-line bg-paper/95 p-2 shadow-lg transition-colors hover:bg-paper tap-highlight-none sm:p-3";

/** Inside a collection every card wears just that collection's badge - a
 * product in both is "New" among the new ones and "Best Seller" among the
 * best sellers. Otherwise each card shows whichever of the two its tags give
 * it. */
function SimilarCard({ product, from }: { product: Product; from: ProductCollection | null }) {
  const images = product.images;
  const { busy, quickAdd } = useQuickAdd(product, images[0] ?? "");
  const isNew = from ? from === "new" : product.isNew;
  const isBestSeller = from ? from === "bestsellers" : product.isBestSeller;
  const colors =
    product.variants.length > 0
      ? product.variants.map((v) => v.name)
      : (product.color ?? "").split(",").map((c) => c.trim()).filter(Boolean);
  const compareAt =
    product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice : null;

  return (
    <div className="group w-[160px] shrink-0 overflow-hidden rounded-lg border border-line bg-paper shadow-sm hover:shadow-lg sm:w-[200px] lg:w-[220px]">
      <Link href={productHref(product.slug, from)} className="block">
        <div className="relative aspect-[9/16] w-full overflow-hidden bg-surface">
          {images[0] ? (
            <Image src={images[0]} alt={product.name} fill sizes="220px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-12 w-12 text-ink-soft" />
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {isBestSeller && (
              <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-band">
                Best Seller
              </span>
            )}
            {isNew && (
              <span className="rounded-full border border-signal/40 bg-paper/90 px-2.5 py-0.5 text-xs font-semibold text-signal">New</span>
            )}
          </div>
          {/* Shows on hover with a mouse; always there on touch screens,
              which have no hover. */}
          {product.stock > 0 && (
            <button
              type="button"
              onClick={quickAdd}
              disabled={busy}
              aria-label="Quick add to bag"
              className="absolute bottom-2 right-2 flex h-9 items-center rounded-md bg-signal px-3 text-paper opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 tap-highlight-none"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="space-y-1 p-2 sm:space-y-2 sm:p-3 lg:p-4">
          <h3 className="line-clamp-2 break-words text-xs font-semibold leading-tight transition-colors group-hover:text-signal sm:text-sm">
            {product.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base font-bold text-signal md:text-lg">{formatPrice(product.price)}</span>
            {compareAt && <span className="text-xs text-ink-soft line-through">{formatPrice(compareAt)}</span>}
          </div>
          {colors.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <span className="text-xs text-ink-soft">Colors:</span>
              <div className="flex items-center gap-1">
                {colors.slice(0, MAX_SWATCHES).map((c) => (
                  <span
                    key={c}
                    title={c}
                    className="h-4 w-4 rounded-full border-2 border-black/15"
                    style={{ backgroundColor: getSwatchColor(c) }}
                  />
                ))}
                {colors.length > MAX_SWATCHES && (
                  <span className="text-xs text-ink-soft">+{colors.length - MAX_SWATCHES}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

/** A product page's "Similar Products": a row of tall cards scrolled by
 * hand - swipe, trackpad, or the arrows, which only show when there's more
 * that way - with dots marking how far along the row is. A list shorter
 * than MIN_CARDS repeats to fill the row. `from` is the collection the
 * products come from, if any. Renders nothing for an empty list. */
export function SimilarProducts({
  products,
  from = null,
}: {
  products: Product[];
  from?: ProductCollection | null;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ canBack: false, canForward: false, dot: 0 });
  const cards =
    products.length > 0
      ? Array.from({ length: Math.max(products.length, MIN_CARDS) }, (_, i) => products[i % products.length])
      : [];
  const dots = Math.ceil(cards.length / CARDS_PER_DOT);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function update() {
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      const canBack = el.scrollLeft > 4;
      const canForward = el.scrollLeft < max - 4;
      const dot = max > 0 ? Math.round((el.scrollLeft / max) * (dots - 1)) : 0;
      // Only re-renders when one of these actually changes.
      setPosition((p) =>
        p.canBack === canBack && p.canForward === canForward && p.dot === dot ? p : { canBack, canForward, dot }
      );
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [dots]);

  if (products.length === 0) return null;

  function scrollByStep(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * ARROW_STEP_PX, behavior: "smooth" });
  }

  const overflowing = position.canBack || position.canForward;

  return (
    <section className="mt-6 sm:mt-8 lg:mt-12">
      <div className="mb-3 text-center sm:mb-4 lg:mb-6">
        <h2 className="mb-1 text-xl font-bold sm:mb-2 sm:text-2xl lg:text-3xl">Similar Products</h2>
        <p className="text-sm text-ink-soft sm:text-base">You might also like these products</p>
      </div>
      {/* The inset is margin around the scroller, not padding inside it, so
          cards are clipped the same distance in on both sides. */}
      <div className="relative mx-2 sm:mx-4">
        {position.canBack && (
          <button type="button" onClick={() => scrollByStep(-1)} aria-label="Scroll left" className={`left-1 sm:left-2 ${ARROW_CLASS}`}>
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        {position.canForward && (
          <button type="button" onClick={() => scrollByStep(1)} aria-label="Scroll right" className={`right-1 sm:right-2 ${ARROW_CLASS}`}>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}
        <div ref={scrollerRef} className="scrollbar-hide overflow-x-auto">
          {/* Centred while it all fits; "safe" falls back to starting at the
              left once it overflows, so the first card is never cut off. */}
          <div className="flex justify-center-safe gap-3 pb-1 sm:gap-6">
            {cards.map((product, i) => (
              <SimilarCard key={`${product.id}-${i}`} product={product} from={from} />
            ))}
          </div>
        </div>
      </div>
      {overflowing && dots > 1 && (
        <div aria-hidden className="mt-2 flex justify-center gap-1.5">
          {Array.from({ length: dots }, (_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i === position.dot ? "bg-signal" : "bg-ink/20"}`} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Every list a product page's Similar Products might show: more from each
 * homepage collection (already without the product itself), and the
 * category-based fallback. */
export type SimilarLists = Record<ProductCollection, Product[]> & { related: Product[] };

function pickList(lists: SimilarLists, from: ProductCollection | null) {
  // A collection with nothing else in it falls back to the related list.
  return from && lists[from].length > 0 ? { products: lists[from], from } : { products: lists.related, from: null };
}

function FromUrl({ lists, fallback }: { lists: SimilarLists; fallback: ProductCollection | null }) {
  const param = useSearchParams().get(COLLECTION_PARAM);
  const from = param === "new" || param === "bestsellers" ? param : fallback;
  return <SimilarProducts {...pickList(lists, from)} />;
}

/** The section's heading over grey card shapes - what the prerendered page
 * shows until the browser knows which list to put there. */
function SimilarProductsPlaceholder() {
  return (
    <section aria-hidden className="mt-6 sm:mt-8 lg:mt-12">
      <div className="mb-3 text-center sm:mb-4 lg:mb-6">
        <h2 className="mb-1 text-xl font-bold sm:mb-2 sm:text-2xl lg:text-3xl">Similar Products</h2>
        <p className="text-sm text-ink-soft sm:text-base">You might also like these products</p>
      </div>
      <div className="mx-2 flex gap-3 overflow-hidden sm:mx-4 sm:gap-6">
        {Array.from({ length: MIN_CARDS }, (_, i) => (
          <div
            key={i}
            className="w-[160px] shrink-0 overflow-hidden rounded-lg border border-line bg-paper sm:w-[200px] lg:w-[220px]"
          >
            <div className="aspect-[9/16] w-full animate-pulse bg-surface" />
            <div className="space-y-2 p-2 sm:p-3 lg:p-4">
              <div className="h-3 w-3/4 rounded bg-surface" />
              <div className="h-4 w-1/3 rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Similar Products for the collection the product was opened from (the
 * ?from= in its link), else the one it belongs to (`fallback`). Product
 * pages are prerendered and the URL is only known in the browser, so the
 * prerendered HTML holds a placeholder rather than a list that might be the
 * wrong collection's. */
export function SimilarProductsFor({ lists, fallback }: { lists: SimilarLists; fallback: ProductCollection | null }) {
  return (
    <Suspense fallback={<SimilarProductsPlaceholder />}>
      <FromUrl lists={lists} fallback={fallback} />
    </Suspense>
  );
}
