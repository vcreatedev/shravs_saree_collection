"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Star, Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import toast from "react-hot-toast";

/** A highlight pinned to the photo's top-left corner: "new" for the New
 * Collections row, or a best-seller ranking (1 = top), whose card also uses
 * the row's tighter text. */
export type CardBadge = { type: "new" } | { type: "rank"; rank: number };

/** The homepage collection a product was opened from. It rides along in the
 * product link (?from=...) so the product page's Similar Products can show
 * more from that same collection. */
export type ProductCollection = "new" | "bestsellers";
export const COLLECTION_PARAM = "from";

export function productHref(slug: string, from?: ProductCollection | null) {
  return from ? `/product/${slug}?${COLLECTION_PARAM}=${from}` : `/product/${slug}`;
}

const BADGE_CLASS = "absolute left-3 top-3 z-10 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

/** A card's quick "add to bag" button: adds one of the product (in its first
 * photo) without leaving the page, ignoring repeat taps for a moment. The
 * button sits inside the card's link, so the click stops there. */
export function useQuickAdd(product: Product, image: string) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const [busy, setBusy] = useState(false);

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image,
      price: product.price,
      quantity: 1,
      stock: product.stock,
    });
    openCart();
    toast.success(`Added ${product.name} to bag`);
    setTimeout(() => setBusy(false), 600);
  }

  return { busy, quickAdd };
}

/** `from` is the collection the card is shown in, carried into its link;
 * without it, a badge implies one ("NEW" - new, a ranking - best sellers). */
export function ProductCard({
  product,
  badge,
  from,
}: {
  product: Product;
  badge?: CardBadge;
  from?: ProductCollection | null;
}) {
  const images = product.images;
  const hoverImage = product.hoverImage ?? images[1];
  const { busy, quickAdd } = useQuickAdd(product, images[0] ?? "");
  const compareAt =
    product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice : null;
  const discount = compareAt ? Math.round(100 - (product.price / compareAt) * 100) : null;
  const compact = badge?.type === "rank";
  const isWished = useWishlistStore((s) => s.hasItem(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);

  function handleHeart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product);
    if (added) {
      toast.success(`Saved to wishlist`);
    } else {
      toast("Removed from wishlist", { icon: "🤍" });
    }
  }

  return (
    <div className="group relative h-full overflow-hidden rounded-lg border border-line bg-paper shadow-sm hover:shadow-md">
      <Link
        href={productHref(product.slug, from ?? (badge ? (badge.type === "new" ? "new" : "bestsellers") : null))}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface">
          {images[0] && (
            <Image
              src={images[0]}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className={`object-cover object-center transition-opacity duration-500 ${hoverImage ? "group-hover:opacity-0" : ""}`}
            />
          )}
          {hoverImage && (
            <Image
              src={hoverImage}
              alt={`${product.name} alternate view`}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}

          {product.stock === 0 ? (
            <span className={`${BADGE_CLASS} bg-ink/80 text-cream`}>Sold out</span>
          ) : badge?.type === "new" ? (
            <span className={`${BADGE_CLASS} bg-signal text-band-fg`}>NEW</span>
          ) : badge?.type === "rank" ? (
            <span className={`${BADGE_CLASS} bg-gold text-band`}>
              <Star className="mr-1 h-3 w-3 fill-current" />#{badge.rank}
            </span>
          ) : null}

          <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-1.5">
            <button
              onClick={handleHeart}
              aria-label={isWished ? "Remove from wishlist" : "Save to wishlist"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 text-ink-soft shadow-sm transition-colors hover:text-signal tap-highlight-none"
            >
              <Heart className={`h-4 w-4 ${isWished ? "fill-signal text-signal" : ""}`} />
            </button>
            <button
              onClick={quickAdd}
              disabled={product.stock === 0 || busy}
              aria-label="Quick add to bag"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-paper/90 text-ink-soft shadow-sm transition-colors hover:text-signal disabled:pointer-events-none disabled:opacity-0 tap-highlight-none"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={compact ? "p-2 md:p-3" : "p-4"}>
          <h3 className={`line-clamp-2 font-medium ${compact ? "mb-1 text-xs md:text-sm" : "mb-2 text-sm"}`}>
            {product.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1">
            <span className={`font-semibold ${compact ? "text-sm" : ""}`}>{formatPrice(product.price)}</span>
            {compareAt && (
              <>
                <span className="text-[10px] text-ink-soft line-through">{formatPrice(compareAt)}</span>
                <span className="rounded-full bg-surface px-1 text-[9px] font-medium">{discount}% OFF</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
