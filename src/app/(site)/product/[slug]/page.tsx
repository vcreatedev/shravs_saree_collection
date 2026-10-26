import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
  getAllProductSlugs,
  getNewArrivals,
  getBestRatedProducts,
} from "@/lib/products";
import { BEST_RATED_TAGS, parseImages, parseList } from "@/lib/utils";
import { ProductPurchase } from "@/components/shop/product-purchase";
import { SimilarProductsFor } from "@/components/shop/similar-products";

// Cached for up to 5 minutes; the admin product routes call revalidatePath
// for a specific product's page immediately after a save/delete.
export const revalidate = 300;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://www.sravsboutique.com";

// Prerenders every product as static HTML at build time, so even a first-ever
// visit is served straight from the CDN with no DB hit - new products just
// render on-demand once and get cached from then on.
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.published) {
    return {
      title: "Product Not Found",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${SITE_URL}/product/${product.slug}`;
  const images = parseImages(product.images);
  const mainImage = images[0] || "/logo.jpg";
  const title = `${product.name} | Buy Online | Shravs Saree Collection`;
  const rawDesc = product.description.replace(/\s+/g, " ").trim();
  const description =
    rawDesc.length > 155 ? `${rawDesc.slice(0, 152).trim()}...` : rawDesc || `Buy ${product.name} online at Shravs Saree Collection.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: mainImage,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [mainImage],
    },
  };
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

  const images = parseImages(product.images);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images.length > 0 ? images : [`${SITE_URL}/logo.jpg`],
    sku: product.id,
    category: product.category?.name,
    brand: {
      "@type": "Brand",
      name: "Shravs Saree Collection",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating.toFixed(1)),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category?.name || "Shop",
        item: `${SITE_URL}/shop?category=${product.category?.slug || ""}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/product/${product.slug}`,
      },
    ],
  };

  return (
    // One centred 1400px column for the details and Similar Products alike,
    // so both line up and the row's side gaps match.
    <div className="mx-auto w-full max-w-[1400px] px-3 pb-6 pt-10 sm:px-4 lg:pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
