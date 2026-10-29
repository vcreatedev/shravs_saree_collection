"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, Trash2, ArrowRight, Sparkles, ShoppingBag } from "lucide-react";
import { useCartStore, cartSubtotal } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { setPageScrollLocked } from "@/lib/scroll-lock";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const mounted = useMounted();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  /* Lock page scrolling & pause Lenis while drawer is open */
  useEffect(() => {
    setPageScrollLocked(isOpen);
    if (isOpen) {
      (window as unknown as { __lenis?: { stop: () => void } }).__lenis?.stop();
      closeBtnRef.current?.focus({ preventScroll: true });
    } else {
      (window as unknown as { __lenis?: { start: () => void } }).__lenis?.start();
    }
    return () => {
      setPageScrollLocked(false);
      (window as unknown as { __lenis?: { start: () => void } }).__lenis?.start();
    };
  }, [isOpen]);

  /* Close drawer when Escape key is pressed */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!mounted) return null;
  const subtotal = cartSubtotal(items);
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div
      className={`fixed inset-0 z-[2500] overflow-hidden ${
        isOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
      } transition-all duration-300`}
      aria-hidden={!isOpen}
    >
      {/* Dimmed backdrop with blur */}
      <div
        onClick={close}
        aria-label="Close cart backdrop"
        className={`absolute inset-0 bg-[#022318]/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Slide-out panel from right to left */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-[#FAF9F6] border-l border-gold/30 shadow-[-15px_0_50px_rgba(0,0,0,0.28)] transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold/20 px-6 py-5 bg-[#FAF9F6] flex-shrink-0">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-2xl font-semibold text-wine tracking-tight">Your Bag</h2>
            <span className="font-serif text-sm font-semibold text-gold tracking-wide">({totalCount})</span>
          </div>
          <button
            ref={closeBtnRef}
            onClick={close}
            aria-label="Close cart drawer"
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-wine/15 text-wine transition-all hover:bg-wine/10 hover:rotate-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Free Shipping & Authenticity Proposition Strip */}
        <div className="flex items-center justify-center gap-2 border-b border-gold/20 bg-gradient-to-r from-[#F0E8D9] via-[#F9F5EE] to-[#F0E8D9] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[#5C4113] flex-shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-gold flex-shrink-0" />
          <span>Free Express Delivery Across India • Silk Mark Assured</span>
        </div>

        {/* Body / Scrollable Items */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wine/5 text-wine/70">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-semibold text-ink">Your bag is empty</h3>
              <p className="text-sm text-ink-soft max-w-xs">
                Explore our curated handloom sarees, heritage weaves, and seasonal arrivals.
              </p>
              <Link
                href="/shop"
                onClick={close}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-wine px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#fff8ec] hover:bg-burgundy transition-colors shadow-sm"
              >
                <span>Browse Sarees</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gold/15">
              {items.map((item) => (
                <li key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-4 py-4">
                  {/* Saree Thumbnail */}
                  <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-[#fff8ec] border border-gold/20 shadow-sm">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={close}
                          className="font-serif text-sm font-semibold text-ink line-clamp-2 hover:text-wine transition-colors"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId, item.color, item.size)}
                          aria-label={`Remove ${item.name} from bag`}
                          type="button"
                          className="text-ink-soft/60 hover:text-signal transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {(item.color || item.size) && (
                        <p className="mt-1 text-xs text-ink-soft">
                          Shade: <span className="font-medium text-ink">{[item.color, item.size].filter(Boolean).join(" / ")}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Quantity Stepper */}
                      <div className="inline-flex items-center rounded-full border border-gold/40 bg-white px-2 py-0.5 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.color, item.size)}
                          className="p-1 text-ink-soft hover:text-wine transition-colors"
                          aria-label="Decrease quantity"
                          type="button"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold text-ink">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.color, item.size)}
                          className="p-1 text-ink-soft hover:text-wine transition-colors"
                          aria-label="Increase quantity"
                          type="button"
                          disabled={item.quantity >= 10}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Line Price */}
                      <p className="font-serif text-sm font-bold text-wine">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer / Checkout CTA */}
        {items.length > 0 && (
          <div className="border-t border-gold/20 bg-[#FAF9F6] px-6 py-5 flex-shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-serif text-ink-soft">Subtotal</span>
              <span className="font-serif text-lg font-bold text-wine">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[11.5px] text-ink-soft/75">
              Free Express Shipping Across India • Taxes Included
            </p>

            <Link
              href="/checkout"
              onClick={close}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-wine py-3.5 text-center text-xs font-bold uppercase tracking-widest text-[#fff8ec] hover:bg-burgundy transition-all shadow-md active:scale-[0.99]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="mt-3 flex items-center justify-center text-center">
              <Link
                href="/shop"
                onClick={close}
                className="text-xs font-medium text-ink-soft hover:text-wine transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
