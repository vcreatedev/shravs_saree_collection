"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";
import { useMounted } from "@/lib/use-mounted";
import { ProductCard } from "@/components/shop/product-card";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="h-8 w-40 mx-auto bg-line/40 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b hairline pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-signal">Saved Collection</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-ink">My Wishlist</h1>
          <span className="text-xs font-medium text-ink-soft">
            {items.length} {items.length === 1 ? "saree" : "sarees"} saved
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mx-auto max-w-md py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream ring-1 ring-gold/40">
            <Heart className="h-7 w-7 text-gold" />
          </div>
          <h2 className="font-display text-2xl font-bold text-ink">Your Wishlist is Empty</h2>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            Discover our curated handloom silk sarees, floral georgettes, and embroidered celebratory drapes to save your favorites.
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3 text-xs font-semibold uppercase tracking-wider text-cream shadow transition-colors hover:bg-ink"
            >
              <span>Explore Collection</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

