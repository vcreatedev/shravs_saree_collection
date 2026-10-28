"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { ShoppingBag, Search, Menu, X, Package, MessageCircle, Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore, cartCount } from "@/store/cart-store";
import { useMounted } from "@/lib/use-mounted";
import { buildWhatsAppLink, generalInquiryMessage } from "@/lib/whatsapp";
import { useSiteSettings } from "@/components/site-settings";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Collections" },
  { href: "/shop?tag=new", label: "New Arrivals" },
  { href: "/shop?sort=rating", label: "Best Sellers" },
  { href: "/orders/my", label: "My Orders" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/contact-us", label: "Contact" },
];

// The marquee slides by exactly one of its three copies per loop, so each
// copy has to be at least as wide as the strip: a short list of messages
// (edited in the Studio: Homepage → Announcement Strip) repeats within a copy
// until it has at least this many.
const MARQUEE_MIN_PER_COPY = 8;

// A burst of clicks on nav links (someone tapping repeatedly, or a
// double-click) each start their own navigation/data fetch - this drops any
// click that lands within half a second of the last one the nav actually
// acted on, so a burst collapses into a single navigation instead of one per
// click, without touching how a normal single click behaves.
const NAV_CLICK_COOLDOWN_MS = 500;

const ICON_BUTTON =
  "relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-band-hover tap-highlight-none";

export function SiteHeader() {
  const settings = useSiteSettings();
  const STORE_NAME = settings.storeName;
  const announcements = settings.announcements;
  const marqueeRepeats = Math.max(1, Math.ceil(MARQUEE_MIN_PER_COPY / Math.max(1, announcements.length)));
  const items = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.open);
  const mounted = useMounted();
  const count = mounted ? cartCount(items) : 0;
  const lastNavClick = useRef(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  // The announcement strip can be dismissed; the header (and so this state)
  // stays mounted across page changes, so it stays hidden until a reload.
  const [barOpen, setBarOpen] = useState(true);

  function guardNavClick(e: React.MouseEvent) {
    const now = Date.now();
    if (now - lastNavClick.current < NAV_CLICK_COOLDOWN_MS) {
      e.preventDefault();
      return;
    }
    lastNavClick.current = now;
    setMobileOpen(false);
  }

  const cartButton = (
    <button onClick={openCart} aria-label="Open cart" className={ICON_BUTTON}>
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-band">
          {count}
        </span>
      )}
    </button>
  );

  const wishItems = useWishlistStore((s) => s.items);
  const wishCount = mounted ? wishItems.length : 0;

  const wishlistLink = (
    <Link href="/wishlist" aria-label="View saved wishlist" className={ICON_BUTTON}>
      <Heart className="h-5 w-5" />
      {wishCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-signal px-1 text-[10px] font-semibold text-cream">
          {wishCount}
        </span>
      )}
    </Link>
  );

  const searchLink = (
    <Link href="/shop" aria-label="Search products" className={ICON_BUTTON}>
      <Search className="h-5 w-5" />
    </Link>
  );

  return (
    <>
      {/* Scrolls away with the page; only the bar below stays pinned. */}
      {barOpen && announcements.length > 0 && (
        <div className="flex items-center justify-between gap-1 overflow-hidden bg-signal px-2 py-0.5 text-band-fg md:gap-3 md:px-4 md:py-1.5">
          <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
            <div className="marquee-track flex">
              {Array.from({ length: 3 }).map((_, copy) => (
                <div
                  key={copy}
                  aria-hidden={copy > 0 ? true : undefined}
                  className="flex whitespace-nowrap text-[9px] font-medium leading-tight md:text-sm"
                >
                  {Array.from({ length: marqueeRepeats }).flatMap((_, repeat) =>
                    announcements.map((item, i) => (
                      <span key={`${repeat}-${i}`} className="inline-block px-1.5 md:px-4">
                        {item}
                      </span>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="ml-1 flex flex-shrink-0 items-center gap-0.5 md:gap-2">
            {settings.whatsappNumber && (
              <a
                href={buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage || generalInquiryMessage(STORE_NAME))}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="flex items-center gap-0.5 whitespace-nowrap rounded-full border border-champagne px-1.5 py-0.5 text-[9px] font-semibold text-champagne shadow-sm transition-colors hover:bg-champagne hover:text-band md:gap-1 md:px-3 md:py-1.5 md:text-sm"
              >
                <MessageCircle className="h-2.5 w-2.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setBarOpen(false)}
              aria-label="Hide announcements"
              className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-band-fg/15 tap-highlight-none md:h-7 md:w-7"
            >
              <X className="h-3 w-3 md:h-4 md:w-4" />
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 w-full border-b border-gold/30 bg-band text-band-fg">
        <div className="w-full px-3 lg:px-4 xl:px-6">
          {/* lg and up: logo, then the links and Track button, then icons. */}
          <div className="hidden min-h-[70px] items-center justify-between px-3 py-2.5 lg:flex">
            <Link href="/" aria-label={STORE_NAME} className="ml-2 flex-shrink-0">
              <span className="relative block h-14 w-14 overflow-hidden rounded-full ring-1 ring-gold/70">
                {settings.logo && <Image src={settings.logo} alt={STORE_NAME} fill sizes="56px" className="object-cover" preload />}
              </span>
            </Link>
            <div className="flex items-center gap-8 xl:gap-10">
              <nav className="flex items-center gap-7 xl:gap-9">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={guardNavClick}
                    className="whitespace-nowrap text-sm font-semibold uppercase tracking-wide transition-colors hover:text-band-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <Link
                href="/orders/track"
                onClick={guardNavClick}
                className="flex h-9 items-center gap-1.5 rounded-md border-2 border-gold px-4 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-band"
              >
                <Package className="h-4 w-4" />
                Track
              </Link>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {searchLink}
              {wishlistLink}
              {cartButton}
            </div>
          </div>

          {/* Below lg: menu button, centred logo, search and cart. */}
          <div className="relative flex min-h-[55px] items-center justify-between py-2.5 md:min-h-[60px] lg:hidden">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className={ICON_BUTTON}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" aria-label={STORE_NAME} className="absolute left-1/2 -translate-x-1/2">
              <span className="relative block h-11 w-11 overflow-hidden rounded-full ring-1 ring-gold/70 md:h-12 md:w-12">
                {settings.logo && <Image src={settings.logo} alt={STORE_NAME} fill sizes="48px" className="object-cover" />}
              </span>
            </Link>
            <div className="flex items-center gap-1 md:gap-2">
              {searchLink}
              {wishlistLink}
              {cartButton}
            </div>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-band-line px-4 pb-4 pt-2 text-sm font-semibold uppercase tracking-wide lg:hidden">
            {[...NAV_LINKS, { href: "/orders/track", label: "Track Order" }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={guardNavClick}
                className="block rounded-md px-2 py-3 transition-colors hover:bg-band-hover hover:text-band-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
