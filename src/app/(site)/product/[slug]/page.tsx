import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts, getAllProductSlugs } from "@/lib/products";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { ProductCard } from "@/components/shop/product-card";

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

  const related = await getRelatedProducts(product.categoryId, product.id);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <ProductPurchase product={product} />
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl italic">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
