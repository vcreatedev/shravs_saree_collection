import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
  getAllProductSlugs,
  getNewArrivals,
  getBestRatedProducts,
} from "@/lib/products";
import { BEST_RATED_TAGS, parseList } from "@/lib/utils";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { SimilarProductsFor } from "@/components/shop/similar-products";

// Cached for up to 5 minutes; the admin product routes call revalidatePath
// for a specific product's page immediately after a save/delete.
export const revalidate = 300;

// Prerenders every product as static HTML at build time, so even a first-ever
// visit is served straight from the CDN with no DB hit - new products just
// render on-demand once and get cached from then on.
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.published) notFound();

  const [related, newArrivals, bestSellers] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getNewArrivals(),
    getBestRatedProducts(),
  ]);
  const others = (list: typeof related) => list.filter((p) => p.id !== product.id);

  // The collection this product belongs to, for a visit that didn't come from
  // a collection (and so has no ?from=): Best Sellers first, then New.
  const tags = parseList(product.tags).map((t) => t.toLowerCase());
  const ownCollection = tags.some((t) => BEST_RATED_TAGS.includes(t))
    ? "bestsellers"
    : tags.includes("new")
      ? "new"
      : null;

  return (
    // One centred 1400px column for the details and Similar Products alike,
    // so both line up and the row's side gaps match.
    <div className="mx-auto w-full max-w-[1400px] px-3 pb-6 pt-10 sm:px-4 lg:pb-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <ProductPurchase product={product} />
      </div>

      <SimilarProductsFor
        lists={{ new: others(newArrivals), bestsellers: others(bestSellers), related }}
        fallback={ownCollection}
      />
    </div>
  );
}
