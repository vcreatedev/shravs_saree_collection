"use client";

import Link from "next/link";
import { ShoppingBag, Search } from "lucide-react";
import { useCartStore, cartCount } from "@/store/cart-store";
import { useMounted } from "@/lib/use-mounted";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";

export function SiteHeader() {
  const items = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.open);
  const mounted = useMounted();
  const count = mounted ? cartCount(items) : 0;

  return (
    <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/80">
      <div className="overflow-hidden border-b hairline bg-ink text-cream">
        <div className="marquee-track flex w-max gap-12 whitespace-nowrap py-1.5 text-[11px] uppercase tracking-[0.2em]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12">
              <span>Free shipping over ₹2,000</span>
              <span>Handpicked, small-batch drops</span>
              <span>Easy 7-day returns</span>
              <span>Pay securely with Razorpay</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link href="/" className="whitespace-nowrap font-display text-lg tracking-tight italic sm:text-2xl">
          {STORE_NAME}
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium tracking-wide md:flex">
          <Link href="/shop" className="hover:text-signal transition-colors">
            Shop All
          </Link>
          <Link href="/shop?tag=new" className="hover:text-signal transition-colors">
            New Arrivals
          </Link>
          <Link href="/shop?sort=rating" className="hover:text-signal transition-colors">
            Best Rated
          </Link>
          <Link href="/orders/track" className="hover:text-signal transition-colors">
            Track Order
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/shop"
            aria-label="Search products"
            className="rounded-full p-2 hover:bg-ink/5 transition-colors tap-highlight-none"
          >
            <Search className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative rounded-full p-2 hover:bg-ink/5 transition-colors tap-highlight-none"
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-signal px-1 text-[10px] font-semibold text-paper">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
