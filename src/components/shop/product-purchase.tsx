"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Truck, RotateCcw, ShieldCheck, MessageCircle, Minus, Plus, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatPrice } from "@/lib/utils";
import { buildWhatsAppLink, productInquiryMessage } from "@/lib/whatsapp";
import { useSiteSettings } from "@/components/site-settings";
import { DeliveryCheck } from "./delivery-check";
import type { Product } from "@/types";

export function ProductPurchase({ product }: { product: Product }) {
  const settings = useSiteSettings();
  const { variants, sizes } = product;

  const [variantKey, setVariantKey] = useState(variants.find((v) => v.inStock)?.key ?? variants[0]?.key);
  const variant = variants.find((v) => v.key === variantKey);
  const [sizeKey, setSizeKey] = useState(sizes.find((s) => s.stock > 0)?.key ?? sizes[0]?.key);
  const size = sizes.find((s) => s.key === sizeKey);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  // The chosen option's photo leads the gallery.
  const images = useMemo(
    () => (variant ? [variant.image, ...product.images.filter((img) => img !== variant.image)] : product.images),
    [variant, product.images]
  );
  // Every photo - all options' too - mounted (invisibly) from the first
  // render, so switching photo or option is just a fade, not a fresh download.
  const allImages = useMemo(
    () => [...new Set([...product.images, ...variants.map((v) => v.image)])],
    [product.images, variants]
  );

  const availableStock = variant && !variant.inStock ? 0 : size ? Math.min(size.stock, product.stock) : product.stock;
  const outOfStock = availableStock === 0;
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
      : null;

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const isWished = useWishlistStore((s) => s.hasItem(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function handleToggleWishlist() {
    const added = toggleWishlist(product);
    if (added) {
      toast.success(`Saved ${product.name} to wishlist`);
    } else {
      toast("Removed from wishlist", { icon: "🤍" });
    }
  }

  function selectVariant(key: string) {
    setVariantKey(key);
    setActiveImage(0);
  }

  function selectSize(key: string) {
    setSizeKey(key);
    setQuantity(1);
  }

  function buildLine() {
    return {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: images[0] ?? "",
      price: product.price,
      quantity: Math.min(quantity, availableStock),
      color: variant?.name,
      size: size?.size,
      stock: availableStock,
    };
  }

  function handleAdd() {
    if (busy) return;
    setBusy(true);
    addItem(buildLine());
    openCart();
    toast.success(`Added ${product.name} to bag`);
    setTimeout(() => setBusy(false), 600);
  }

  function handleBuyNow() {
    if (busy) return;
    setBusy(true);
    addItem(buildLine());
    openCart();
    router.push("/checkout");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const whatsappHref = buildWhatsAppLink(
    settings.whatsappNumber,
    productInquiryMessage(`${product.name}${product.code ? ` (${product.code})` : ""}`, `${siteUrl}/product/${product.slug}`)
  );
  const badges = [product.isNew && "New", product.isBestSeller && "Best Seller"].filter(Boolean) as string[];

  return (
    <>
      <div>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-surface lg:max-w-none">
          {allImages.map((src) => (
            <Image
              key={src}
              src={src}
              alt={src === images[activeImage] ? product.name : ""}
              fill
              preload={src === images[0]}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={`object-cover transition-opacity duration-300 ${
                src === images[activeImage] ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {images.map((img, i) => (
              <button
                key={img}
                onClick={() => setActiveImage(i)}
                aria-label={`Show photo ${i + 1}`}
                className={`relative h-20 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                  activeImage === i ? "border-signal" : "border-transparent"
                }`}
              >
                <Image src={img} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-signal">{product.category.name}</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>
        {product.code && <p className="mt-1 text-xs text-ink-soft">Code: {product.code}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-4">
          {product.rating > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="font-medium">{product.rating.toFixed(1)}</span>
              {product.reviewCount > 0 && <span className="text-ink-soft">({product.reviewCount} reviews)</span>}
            </div>
          )}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((t) => (
                <span key={t} className="rounded-full bg-signal/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-semibold">{formatPrice(product.price)}</span>
          {discount && product.compareAtPrice && (
            <>
              <span className="text-lg text-ink-soft line-through">{formatPrice(product.compareAtPrice)}</span>
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold">{discount}% OFF</span>
            </>
          )}
        </div>

        {product.description && <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-soft">{product.description}</p>}

        <div className="mt-8 space-y-6">
          {variants.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {product.optionName}: <span className="text-ink">{variant?.name}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {variants.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => selectVariant(v.key)}
                    disabled={!v.inStock}
                    aria-label={`${v.name}${v.inStock ? "" : " (sold out)"}`}
                    aria-pressed={v.key === variantKey}
                    title={v.name}
                    className={`relative h-16 w-14 overflow-hidden rounded-md ring-2 ring-offset-2 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                      v.key === variantKey ? "ring-signal" : "ring-transparent hover:ring-line"
                    }`}
                  >
                    <Image src={v.image} alt="" fill sizes="56px" className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Size: <span className="text-ink">{size?.size}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => selectSize(s.key)}
                    disabled={s.stock === 0}
                    aria-pressed={s.key === sizeKey}
                    className={`h-10 min-w-10 rounded-full border px-3 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      s.key === sizeKey ? "border-ink bg-ink text-cream" : "hairline hover:border-ink"
                    }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-full border hairline px-3 py-2">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="hover:text-signal">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-5 text-center text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                aria-label="Increase quantity"
                className="hover:text-signal"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-ink-soft">
              {outOfStock ? "Sold out" : `${availableStock} in stock${size ? ` in size ${size.size}` : ""}`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row items-center">
            <button
              onClick={handleAdd}
              disabled={outOfStock || busy}
              className="flex-1 w-full rounded-full border-2 border-ink py-3.5 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
            >
              {outOfStock ? "Sold out" : "Add to bag"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock || busy}
              className="flex-1 w-full rounded-full bg-signal py-3.5 text-sm font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-signal-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Buy it now
            </button>
            <button
              type="button"
              onClick={handleToggleWishlist}
              title={isWished ? "Remove from wishlist" : "Save to wishlist"}
              aria-label={isWished ? "Remove from wishlist" : "Save to wishlist"}
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                isWished
                  ? "border-signal bg-signal/10 text-signal"
                  : "border-line bg-paper text-ink-soft hover:border-signal hover:text-signal"
              }`}
            >
              <Heart className={`h-5 w-5 ${isWished ? "fill-signal text-signal" : ""}`} />
            </button>
          </div>
        </div>

        {settings.whatsappNumber && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-full border hairline py-3 text-sm font-medium text-forest transition-colors hover:border-forest"
          >
            <MessageCircle className="h-4 w-4" /> Ask about this product on WhatsApp
          </a>
        )}

        <div className="mt-6">
          <DeliveryCheck />
        </div>

        {product.details.length > 0 && (
          <dl className="mt-6 divide-y divide-line rounded-lg border border-line bg-paper text-sm">
            {product.details.map((d) => (
              <div key={d.label} className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-2.5">
                <dt className="text-ink-soft">{d.label}</dt>
                <dd>{d.value}</dd>
              </div>
            ))}
          </dl>
        )}

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
    </>
  );
}
