"use client";

import { useState } from "react";
import { LayoutGrid, GalleryHorizontal } from "lucide-react";
import type { ProductWithCategory } from "@/types";
import { ProductCard, type CardBadge } from "./product-card";
import { Rail } from "./rail";

/** Which highlight every card in a row gets: a "NEW" tag, or its place in
 * the best-seller ranking. */
export type RowBadges = "new" | "rank";

function badgeFor(badges: RowBadges | undefined, index: number): CardBadge | undefined {
  if (badges === "new") return { type: "new" };
  if (badges === "rank") return { type: "rank", rank: index + 1 };
  return undefined;
}

type RowProps = { title: string; products: ProductWithCategory[]; badges?: RowBadges };

/** The products drifting endlessly in a row of 200px cards. */
export function ProductCarousel({ title, products, badges }: RowProps) {
  return (
    <Rail label={title} gapClassName="gap-4 pr-4">
      {products.map((product, i) => (
        <div key={product.id} className="h-full w-[200px]">
          <ProductCard product={product} badge={badgeFor(badges, i)} />
        </div>
      ))}
    </Rail>
  );
}

// The grid's column count at each breakpoint, with the class that hides a
// card at that breakpoint only.
const GRID_STEPS = [
  { columns: 2, hide: "max-sm:hidden" },
  { columns: 3, hide: "sm:max-md:hidden" },
  { columns: 4, hide: "md:max-lg:hidden" },
  { columns: 5, hide: "lg:hidden" },
] as const;

// Like the carousel, a short list is repeated to at least this many cards.
const GRID_MIN_CARDS = 8;

/** The same cards in a grid that always ends on a full row: a short list
 * repeats (keeping each product's own badge) up to at least GRID_MIN_CARDS,
 * rounded up to whole rows for each breakpoint's column count. Enough cards
 * for the widest case are rendered, and each breakpoint hides the ones past
 * its own last full row. */
function ProductGrid({ products, badges }: Omit<RowProps, "title">) {
  const base = Math.max(products.length, GRID_MIN_CARDS);
  const counts = GRID_STEPS.map((step) => Math.ceil(base / step.columns) * step.columns);
  const total = Math.max(...counts);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: total }, (_, i) => {
        const index = i % products.length;
        const hide = GRID_STEPS.filter((_, step) => i >= counts[step])
          .map((step) => step.hide)
          .join(" ");
        return (
          <div key={`${products[index].id}-${Math.floor(i / products.length)}`} className={hide}>
            <ProductCard product={products[index]} badge={badgeFor(badges, index)} />
          </div>
        );
      })}
    </div>
  );
}

type View = "grid" | "carousel";

const VIEW_OPTIONS = [
  { view: "grid", label: "Grid", icon: LayoutGrid },
  { view: "carousel", label: "Carousel", icon: GalleryHorizontal },
] as const;

/** The products with a Grid / Carousel switch above them, opening on the
 * grid. */
export function SwitchableProducts({ title, products, badges }: RowProps) {
  const [view, setView] = useState<View>("grid");

  return (
    <>
      <div className="mb-6 flex justify-center" role="group" aria-label={`${title} layout`}>
        <div className="inline-flex rounded-md border border-line bg-paper p-1 shadow-sm">
          {VIEW_OPTIONS.map((option) => {
            const active = view === option.view;
            return (
              <button
                key={option.view}
                type="button"
                onClick={() => setView(option.view)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors tap-highlight-none ${
                  active ? "bg-signal text-paper" : "text-ink-soft hover:text-signal"
                }`}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      {view === "grid" ? (
        <ProductGrid products={products} badges={badges} />
      ) : (
        <ProductCarousel title={title} products={products} badges={badges} />
      )}
    </>
  );
}
