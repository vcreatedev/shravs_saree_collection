"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category } from "@prisma/client";
import { FiltersSidebar } from "./filters-sidebar";
import { setPageScrollLocked } from "@/lib/scroll-lock";

type Props = {
  categories: Category[];
  bounds: { min: number; max: number };
  colors: string[];
  sizes: string[];
  resultCount: number;
};

/** Mobile-only equivalent of FiltersSidebar - the same controls, but tucked
 * behind a "Filters" button and a bottom-sheet instead of rendered inline
 * above the product grid, so products are visible right away on a phone
 * instead of after scrolling past the full filter list. Desktop keeps the
 * always-visible sidebar (this component renders nothing there). */
export function MobileFilters({ categories, bounds, colors, sizes, resultCount }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPageScrollLocked(open);
    return () => setPageScrollLocked(false);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border hairline px-4 py-2 text-sm font-medium transition-colors hover:border-ink"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </button>

      <div
        // overflow-hidden clips the closed sheet, parked just past the bottom
        // edge, so it can never extend the page on iOS Safari.
        className={`fixed inset-0 z-50 overflow-hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-3xl bg-paper shadow-2xl transition-transform duration-300 ${
            open ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex items-center justify-between border-b hairline px-5 py-4">
            <h2 className="font-display text-xl italic">Filters</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
              className="rounded-full p-1.5 hover:bg-ink/5"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <FiltersSidebar categories={categories} bounds={bounds} colors={colors} sizes={sizes} />
          </div>

          <div className="border-t hairline px-5 py-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-full bg-ink py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal"
            >
              Show {resultCount} {resultCount === 1 ? "product" : "products"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
