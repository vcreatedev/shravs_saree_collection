"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useCartStore, cartCount } from "@/store/cart-store";
import { useMounted } from "@/lib/use-mounted";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";

const NAV_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?tag=new", label: "New Arrivals" },
  { href: "/shop?sort=rating", label: "Best Rated" },
  { href: "/orders/my", label: "My Orders" },
];

// A burst of clicks on nav links (someone tapping repeatedly, or a
// double-click) each start their own navigation/data fetch - this drops any
// click that lands within half a second of the last one the nav actually
// acted on, so a burst collapses into a single navigation instead of one per
// click, without touching how a normal single click behaves.
const NAV_CLICK_COOLDOWN_MS = 500;

export function SiteHeader() {
  const items = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.open);
  const mounted = useMounted();
  const count = mounted ? cartCount(items) : 0;
  const lastNavClick = useRef(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  function guardNavClick(e: React.MouseEvent) {
    const now = Date.now();
    if (now - lastNavClick.current < NAV_CLICK_COOLDOWN_MS) {
      e.preventDefault();
      return;
    }
    lastNavClick.current = now;
    setMobileOpen(false);
  }

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

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:gap-6 sm:px-8">
        <Link
          href="/"
          className="min-w-0 flex-1 truncate font-display text-lg tracking-tight italic sm:flex-none sm:text-2xl"
        >
          {STORE_NAME}
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium tracking-wide md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={guardNavClick} className="hover:text-signal transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
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
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="rounded-full p-2 hover:bg-ink/5 transition-colors tap-highlight-none md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t hairline bg-cream px-5 py-3 text-sm font-medium tracking-wide sm:px-8 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={guardNavClick}
                className="rounded-lg px-2 py-2.5 hover:bg-ink/5 hover:text-signal transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
