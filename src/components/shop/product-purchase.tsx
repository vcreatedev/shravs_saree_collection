"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Truck, RotateCcw, ShieldCheck, MessageCircle, Minus, Plus, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cart-store";
import {
  formatPrice,
  parseImages,
  parseList,
  parseSizeStock,
  parseColorVariants,
  effectivePrice,
  compareAtPriceForColor,
  imagesForColor,
  nameForColor,
  descriptionForColor,
  sizesForColor,
  sizeStockForColor,
  tagsForColor,
  ratingForColor,
} from "@/lib/utils";
import { getSwatchColor, isLightSwatch } from "@/lib/color-swatches";
import { buildWhatsAppLink, productInquiryMessage } from "@/lib/whatsapp";
import type { ProductWithCategory } from "@/types";

export function ProductPurchase({ product }: { product: ProductWithCategory }) {
  const colors = parseList(product.colors);
  const baseSizes = parseList(product.sizes);
  const variants = useMemo(() => parseColorVariants(product.colorVariants), [product.colorVariants]);
  const baseImages = useMemo(() => parseImages(product.images), [product.images]);
  const baseSizeStock = useMemo(() => parseSizeStock(product.sizeStock), [product.sizeStock]);

  const [color, setColor] = useState(colors[0]);
  const sizes = sizesForColor(baseSizes, variants, color);
  const [size, setSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const images = imagesForColor(baseImages, variants, color);
  const name = nameForColor(product.name, variants, color);
  const description = descriptionForColor(product.description, variants, color);
  const price = effectivePrice(product.price, variants, color);
  const compareAtPrice = compareAtPriceForColor(product.compareAtPrice, variants, color);
  const sizeStock = sizeStockForColor(baseSizeStock, variants, color);
  const tags = parseList(tagsForColor(product.tags, variants, color));
  const rating = ratingForColor(product.rating, variants, color);
  const hasSizeStock = sizes.length > 0 && Object.keys(sizeStock).length > 0;
  const availableStock = hasSizeStock ? sizeStock[size] ?? 0 : product.stock;
  const outOfStock = availableStock === 0;

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const router = useRouter();

  function selectColor(c: string) {
    setColor(c);
    setActiveImage(0);
    setQuantity(1);
    setSize(sizesForColor(baseSizes, variants, c)[0]);
  }

  function selectSize(s: string) {
    setSize(s);
    setQuantity(1);
  }

  function buildLine() {
    return {
      productId: product.id,
      name,
      slug: product.slug,
      image: images[0] ?? "",
      price,
      quantity,
      color,
      size,
      stock: availableStock,
    };
  }

  function handleAdd() {
    addItem(buildLine());
    toast.success(`Added ${name} to bag`);
  }

  function handleBuyNow() {
    addItem(buildLine());
    openCart();
    router.push("/checkout");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const whatsappHref = buildWhatsAppLink(productInquiryMessage(name, `${siteUrl}/product/${product.slug}`));

  return (
    <>
      <div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#efe9db]">
          {images[activeImage] && (
            <Image
              src={images[activeImage]}
              alt={name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex gap-3">
            {images.map((img, i) => (
              <button
                key={img + i}
                onClick={() => setActiveImage(i)}
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
          {product.category.name}
        </p>
        <h1 className="mt-2 font-display text-3xl italic leading-tight sm:text-4xl">{name}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-ink-soft">({product.reviewCount} reviews)</span>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-signal/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-display text-3xl">{formatPrice(price)}</span>
          {compareAtPrice && (
            <span className="text-lg text-ink-soft line-through">{formatPrice(compareAtPrice)}</span>
          )}
        </div>

        <p className="mt-5 leading-relaxed text-ink-soft">{description}</p>

        <div className="mt-8 space-y-6">
          {colors.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
                Color: <span className="text-ink">{color}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {colors.map((c) => {
                  const hex = getSwatchColor(c);
                  const isActive = color === c;
                  const isLight = isLightSwatch(hex);
                  return (
                    <button
                      key={c}
                      onClick={() => selectColor(c)}
                      aria-label={c}
                      title={c}
                      className={`relative flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-offset-2 transition-all ${
                        isActive ? "ring-ink" : "ring-transparent hover:ring-line"
                      } ${isLight ? "border border-line" : ""}`}
                      style={{ backgroundColor: hex }}
                    >
                      {isActive && (
                        <Check className={`h-4 w-4 ${isLight ? "text-ink" : "text-white"}`} strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
                Size: <span className="text-ink">{size}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const sizeOut = hasSizeStock && (sizeStock[s] ?? 0) === 0;
                  return (
                    <button
                      key={s}
                      onClick={() => selectSize(s)}
                      disabled={sizeOut}
                      className={`h-10 min-w-10 rounded-full border px-3 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        size === s ? "border-ink bg-ink text-cream" : "hairline hover:border-ink"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-full border hairline px-3 py-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="hover:text-signal"
              >
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
              {availableStock} in stock{hasSizeStock ? ` for size ${size}` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="flex-1 rounded-full border-2 border-ink py-3.5 text-sm font-semibold uppercase tracking-wide transition-colors hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
            >
              {outOfStock ? "Sold out" : "Add to bag"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock}
              className="flex-1 rounded-full bg-signal py-3.5 text-sm font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-signal-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Buy it now
            </button>
          </div>
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
    </>
  );
}
