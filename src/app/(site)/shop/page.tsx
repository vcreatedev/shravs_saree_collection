import { getCategories, getPriceBounds, getProducts } from "@/lib/products";
import { getUsedColors, getUsedSizes } from "@/lib/catalog-options";
import { ProductCard } from "@/components/shop/product-card";
import { FiltersSidebar } from "@/components/shop/filters-sidebar";
import { MobileFilters } from "@/components/shop/mobile-filters";
import { SearchBox } from "@/components/shop/search-box";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import type { ProductFilters } from "@/types";

export const metadata = { title: "Shop All" };

type SearchParams = { [key: string]: string | string[] | undefined };

function parseFilters(searchParams: SearchParams): ProductFilters {
  const get = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    q: get("q"),
    category: get("category"),
    tag: get("tag"),
    color: get("color"),
    size: get("size"),
    minPrice: get("minPrice") ? Number(get("minPrice")) : undefined,
    maxPrice: get("maxPrice") ? Number(get("maxPrice")) : undefined,
    sort: (get("sort") as ProductFilters["sort"]) ?? "newest",
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const filters = parseFilters(resolvedParams);
  const [products, categories, bounds, colors, sizes] = await Promise.all([
    getProducts(filters),
    getCategories(),
    getPriceBounds(),
    getUsedColors(),
    getUsedSizes(),
  ]);

  return (
    // group: the results dim while the search box has a search in flight.
    <div className="group mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <Reveal>
        <div className="flex flex-col gap-2 border-b hairline pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
              {filters.category ? categories.find((c) => c.slug === filters.category)?.name : "Everything"}
            </p>
            <h1 className="font-display text-4xl italic">Shop the collection</h1>
          </div>
          <SearchBox />
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-10 py-10 md:grid-cols-[220px_1fr]">
        <div className="hidden md:block">
          <FiltersSidebar categories={categories} bounds={bounds} colors={colors} sizes={sizes} />
        </div>

        <div className="transition-opacity duration-200 group-has-data-pending:opacity-50">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-ink-soft">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
            <MobileFilters
              categories={categories}
              bounds={bounds}
              colors={colors}
              sizes={sizes}
              resultCount={products.length}
            />
          </div>
          {products.length === 0 ? (
            <div className="rounded-xl border hairline bg-paper py-24 text-center">
              <p className="font-display text-xl italic">No products match your filters</p>
              <p className="mt-2 text-sm text-ink-soft">Try widening your search.</p>
            </div>
          ) : (
            <StaggerGroup className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
              {products.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </div>
      </div>
    </div>
  );
}
