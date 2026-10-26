import { getCategories, getProducts } from "@/lib/products";
import { CollectionView } from "@/components/shop/collection-view";
import type { ProductFilters } from "@/types";

export const metadata = { title: "Collections" };

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
  const filters = parseFilters(await searchParams);
  const [products, categories] = await Promise.all([getProducts(filters), getCategories()]);

  return (
    <div className="w-full px-4 py-8">
      <h1 className="sr-only">Collections</h1>
      <CollectionView products={products} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
    </div>
  );
}
