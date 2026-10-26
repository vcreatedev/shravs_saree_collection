import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/products";
import { CollectionView } from "@/components/shop/collection-view";
import type { ProductFilters } from "@/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://www.sravsboutique.com";

type SearchParams = { [key: string]: string | string[] | undefined };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const resolved = await searchParams;
  const categorySlug = Array.isArray(resolved.category) ? resolved.category[0] : resolved.category;
  const tag = Array.isArray(resolved.tag) ? resolved.tag[0] : resolved.tag;

  let title = "Shop All Sarees & Ethnic Wear | Shravs Saree Collection";
  let description =
    "Browse our handpicked collection of silk sarees, printed georgettes, and embroidered anarkali gowns. Premium Indian ethnic drapes with secure payments and pan-India shipping.";
  let canonical = `${SITE_URL}/shop`;

  if (categorySlug) {
    const categories = await getCategories();
    const cat = categories.find((c) => c.slug === categorySlug);
    if (cat) {
      title = `${cat.name} Online — Handpicked Collection | Shravs Saree Collection`;
      description =
        cat.heroDescription ||
        `Explore handpicked ${cat.name.toLowerCase()} at Shravs Saree Collection. Premium fabrics and timeless craftsmanship for festive and wedding celebrations.`;
      canonical = `${SITE_URL}/shop?category=${cat.slug}`;
    }
  } else if (tag === "new") {
    title = "New Arrivals — Latest Saree Designs & Ethnic Wear | Shravs Saree Collection";
    description =
      "Discover the latest arrivals in silk sarees, georgette prints, and designer festive wear at Shravs Saree Collection.";
    canonical = `${SITE_URL}/shop?tag=new`;
  }

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: [
        {
          url: "/logo.jpg",
          alt: "Shravs Saree Collection",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

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
