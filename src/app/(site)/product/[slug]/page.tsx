import { notFound } from "next/navigation";
import { MessageCircle, Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { formatPrice, parseImages } from "@/lib/utils";
import { ProductGallery } from "@/components/shop/product-gallery";
import { AddToCart } from "@/components/shop/add-to-cart";
import { ProductCard } from "@/components/shop/product-card";
import { buildWhatsAppLink, productInquiryMessage } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);
  const images = parseImages(product.images);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const whatsappHref = buildWhatsAppLink(
    productInquiryMessage(product.name, `${siteUrl}/product/${product.slug}`)
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <ProductGallery images={images} name={product.name} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
            {product.category.name}
          </p>
          <h1 className="mt-2 font-display text-3xl italic leading-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-ink-soft">({product.reviewCount} reviews)</span>
            </div>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-ink-soft line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-ink-soft">{product.description}</p>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-full border hairline py-3 text-sm font-medium text-forest transition-colors hover:border-forest"
          >
            <MessageCircle className="h-4 w-4" /> Ask about this product on WhatsApp
          </a>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t hairline pt-6 text-center text-xs text-ink-soft">
            <div className="flex flex-col items-center gap-2">
              <Truck className="h-5 w-5" strokeWidth={1.5} />
              Fast shipping
            </div>
            <div className="flex flex-col items-center gap-2">
              <RotateCcw className="h-5 w-5" strokeWidth={1.5} />
              7-day returns
            </div>
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
              Secure checkout
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display text-2xl italic">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
