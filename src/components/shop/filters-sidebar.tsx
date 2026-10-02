"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/utils";
import { getSwatchColor, isLightSwatch } from "@/lib/color-swatches";
import type { Category } from "@prisma/client";
import { X, Check } from "lucide-react";

type Props = {
  categories: Category[];
  bounds: { min: number; max: number };
  colors: string[];
  sizes: string[];
};

export function FiltersSidebar({ categories, bounds, colors, sizes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeCategory = searchParams.get("category") ?? "";
  const activeColor = searchParams.get("color") ?? "";
  const activeSize = searchParams.get("size") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";
  const urlMaxPrice = Number(searchParams.get("maxPrice") ?? bounds.max);
  const [maxPrice, setMaxPrice] = useState(urlMaxPrice);
  const [syncedMaxPrice, setSyncedMaxPrice] = useState(urlMaxPrice);

  // Follow the URL when it changes elsewhere (Clear all, back/forward), so
  // the slider never shows a limit the results aren't using.
  if (urlMaxPrice !== syncedMaxPrice) {
    setSyncedMaxPrice(urlMaxPrice);
    setMaxPrice(urlMaxPrice);
  }

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

  // Runs whenever a slider gesture ends, however it ends - released, cancelled
  // by the browser (a drag that drifts into a scroll fires touchcancel, not
  // touchend), or a key press - so the label never shows a price the results
  // aren't filtered by. Dragging all the way back up drops the price filter.
  function applyPriceRange() {
    const params = new URLSearchParams(searchParams.toString());
    if (maxPrice >= bounds.max) {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      params.set("minPrice", String(bounds.min));
      params.set("maxPrice", String(maxPrice));
    }
    if (params.toString() === searchParams.toString()) return;
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const hasFilters =
    activeCategory || activeColor || activeSize || searchParams.get("minPrice") || searchParams.get("q");

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

      {colors.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Color</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((c) => {
              const hex = getSwatchColor(c);
              const isActive = activeColor === c;
              const isLight = isLightSwatch(hex);
              return (
                <button
                  key={c}
                  onClick={() => setParam("color", isActive ? null : c)}
                  aria-label={c}
                  title={c}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-2 transition-all ${
                    isActive ? "ring-ink" : "ring-transparent hover:ring-line"
                  } ${isLight ? "border border-line" : ""}`}
                  style={{ backgroundColor: hex }}
                >
                  {isActive && (
                    <Check className={`h-3.5 w-3.5 ${isLight ? "text-ink" : "text-white"}`} strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Size</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setParam("size", activeSize === s ? null : s)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  activeSize === s ? "border-ink bg-ink text-cream" : "hairline hover:border-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

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
            onTouchCancel={applyPriceRange}
            onKeyUp={applyPriceRange}
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
