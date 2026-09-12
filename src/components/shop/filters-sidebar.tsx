"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/utils";
import type { Category } from "@prisma/client";
import { X } from "lucide-react";

type Props = {
  categories: Category[];
  bounds: { min: number; max: number };
};

export function FiltersSidebar({ categories, bounds }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeCategory = searchParams.get("category") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get("maxPrice") ?? bounds.max));

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function applyPriceRange() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("minPrice", String(bounds.min));
    params.set("maxPrice", String(maxPrice));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const hasFilters = activeCategory || searchParams.get("minPrice") || searchParams.get("q");

  return (
    <div className="space-y-8">
      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1.5 text-xs font-medium text-signal hover:text-signal-dark"
        >
          <X className="h-3.5 w-3.5" /> Clear all filters
        </button>
      )}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Category
        </h3>
        <ul className="mt-4 space-y-2">
          <li>
            <button
              onClick={() => setParam("category", null)}
              className={`text-sm transition-colors hover:text-signal ${
                !activeCategory ? "font-semibold text-signal" : "text-ink"
              }`}
            >
              All products
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => setParam("category", cat.slug)}
                className={`text-sm transition-colors hover:text-signal ${
                  activeCategory === cat.slug ? "font-semibold text-signal" : "text-ink"
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Price</h3>
        <div className="mt-4 space-y-3">
          <input
            type="range"
            min={bounds.min}
            max={bounds.max}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            onMouseUp={applyPriceRange}
            onTouchEnd={applyPriceRange}
            className="w-full accent-[#ff4b1f]"
          />
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>{formatPrice(bounds.min)}</span>
            <span className="font-semibold text-ink">up to {formatPrice(maxPrice)}</span>
            <span>{formatPrice(bounds.max)}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Sort by</h3>
        <select
          value={activeSort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="mt-3 w-full rounded-lg border hairline bg-paper px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>
    </div>
  );
}
