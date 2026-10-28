"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, LayoutGrid, List } from "lucide-react";
import type { ProductSort, Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { ProductCard, productHref, type ProductCollection } from "./product-card";
import { SearchBox } from "./search-box";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "rating", label: "Best Sellers" },
];
const DEFAULT_SORT: ProductSort = "newest";

// Products shown at first, and added by each "Show more".
const PAGE_SIZE = 24;

type Option = { value: string; label: string };

function Select({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className: string;
}) {
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none truncate rounded-md border border-line bg-cream pl-3 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
    </div>
  );
}

/** One product as a wide row for the list view: photo on the left, name,
 * a couple of lines of its description and the price on the right. */
function ListRow({ product, from }: { product: Product; from: ProductCollection | null }) {
  const images = product.images;
  const compareAt =
    product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice : null;
  const discount = compareAt ? Math.round(100 - (product.price / compareAt) * 100) : null;

  return (
    <Link
      href={productHref(product.slug, from)}
      className="flex items-stretch gap-4 overflow-hidden rounded-lg border border-line bg-paper shadow-md hover:shadow-xl"
    >
      <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden bg-surface sm:h-48 sm:w-48 md:h-56 md:w-56">
        {images[0] && <Image src={images[0]} alt={product.name} fill sizes="224px" className="object-cover" />}
      </div>
      <div className="flex flex-1 flex-col justify-center p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-tight md:text-base">{product.name}</h3>
        <p className="mb-3 line-clamp-2 text-xs text-ink-soft">{product.description}</p>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-base font-bold md:text-lg">{formatPrice(product.price)}</span>
          {compareAt && <span className="text-xs text-ink-soft line-through">{formatPrice(compareAt)}</span>}
          {discount && (
            <span className="rounded-full bg-surface px-1.5 text-[10px] font-medium">{discount}% OFF</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** The collections page: one bar of search, category and sort (kept in the
 * URL, so a filtered view can be shared or bookmarked) with the result
 * count and a grid/list switch, over the products - the first PAGE_SIZE,
 * then more with each "Show more". */
export function CollectionView({
  products,
  categories,
}: {
  products: Product[];
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [shown, setShown] = useState(PAGE_SIZE);

  // New results (a search, a category, a sort) start again from the top.
  const resultsKey = searchParams.toString();
  const [shownFor, setShownFor] = useState(resultsKey);
  if (shownFor !== resultsKey) {
    setShownFor(resultsKey);
    setShown(PAGE_SIZE);
  }

  const categoryParam = searchParams.get("category") ?? "";
  const category = categories.some((c) => c.slug === categoryParam) ? categoryParam : "";
  const sortParam = searchParams.get("sort");
  const sort = SORT_OPTIONS.some((o) => o.value === sortParam) ? (sortParam as ProductSort) : DEFAULT_SORT;
  // The Best Sellers and New Arrivals views pass that collection on to the
  // product page, for its Similar Products.
  const from: ProductCollection | null =
    sort === "rating" ? "bestsellers" : searchParams.get("tag")?.toLowerCase() === "new" ? "new" : null;

  // replace, not push, like the search box; the transition keeps the current
  // results up (dimmed) until the new ones arrive.
  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  return (
    // group: the results dim while a search or a filter change is in flight.
    <div className="group">
      <div
        data-pending={isPending ? "" : undefined}
        className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-center gap-3">
          <SearchBox />
          <Select
            label="Category"
            className="w-36 md:w-44"
            value={category}
            options={[{ value: "", label: "All" }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]}
            onChange={(value) => setParam("category", value || null)}
          />
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-sm font-semibold">
            {products.length} {products.length === 1 ? "item" : "items"}
          </span>
          <Select
            label="Sort by"
            className="w-36 md:w-40"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(value) => setParam("sort", value === DEFAULT_SORT ? null : value)}
          />
          <button
            type="button"
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            aria-label={view === "grid" ? "Show as a list" : "Show as a grid"}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-signal bg-cream text-signal transition-colors hover:bg-signal hover:text-paper tap-highlight-none"
          >
            {view === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="transition-opacity duration-200 group-has-data-pending:opacity-50">
        {products.length === 0 ? (
          <div className="rounded-lg border border-line bg-paper py-24 text-center">
            <p className="text-xl font-semibold">No products match your search</p>
            <p className="mt-2 text-sm text-ink-soft">Try another word or category.</p>
          </div>
        ) : (
          <>
            <div
              className={`mb-8 grid gap-2 md:gap-3 ${
                view === "grid" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
              }`}
            >
              {products
                .slice(0, shown)
                .map((product) =>
                  view === "grid" ? (
                    <ProductCard key={product.id} product={product} from={from} />
                  ) : (
                    <ListRow key={product.id} product={product} from={from} />
                  )
                )}
            </div>
            {shown < products.length && (
              <div className="mt-10 flex justify-center pb-8">
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                  className="h-11 min-w-[200px] rounded-md border border-signal bg-cream px-8 text-sm font-medium text-signal transition-colors hover:bg-signal hover:text-paper"
                >
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
