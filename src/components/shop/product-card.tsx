"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Plus } from "lucide-react";
import { formatPrice, parseImages } from "@/lib/utils";
import type { ProductWithCategory } from "@/types";
import { useCartStore } from "@/store/cart-store";
import toast from "react-hot-toast";

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const images = parseImages(product.images);
  const addItem = useCartStore((s) => s.addItem);
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
      : null;

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: images[0] ?? "",
      price: product.price,
      quantity: 1,
      stock: product.stock,
    });
    toast.success(`Added ${product.name} to bag`);
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#efe9db]">
        {images[0] && (
          <Image
            src={images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        {images[1] && (
          <Image
            src={images[1]}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {discount && (
          <span className="absolute left-3 top-3 rounded-full bg-signal px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-paper">
            {discount}% off
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-cream">
            Sold out
          </span>
        )}

        <button
          onClick={quickAdd}
          disabled={product.stock === 0}
          aria-label="Quick add to bag"
          className="absolute bottom-3 right-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-paper text-ink opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0 hover:bg-signal hover:text-paper"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">
          {product.category.name}
        </p>
        <h3 className="font-display text-base leading-snug">{product.name}</h3>
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-ink-soft line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-ink-soft">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
            {product.rating.toFixed(1)}
          </div>
        </div>
      </div>
    </Link>
  );
}
