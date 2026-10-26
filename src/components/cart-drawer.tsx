"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore, cartSubtotal } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { useEffect } from "react";
import { useMounted } from "@/lib/use-mounted";
import { setPageScrollLocked } from "@/lib/scroll-lock";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const mounted = useMounted();

  useEffect(() => {
    setPageScrollLocked(isOpen);
    return () => setPageScrollLocked(false);
  }, [isOpen]);

  if (!mounted) return null;
  const subtotal = cartSubtotal(items);

  return (
    <div
      // overflow-hidden clips the closed drawer, parked just past the right
      // edge - unclipped, iOS Safari lets the page pan sideways to it.
      className={`fixed inset-0 z-50 overflow-hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      <div
        onClick={close}
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b hairline px-6 py-5">
          <h2 className="text-xl font-semibold">Your bag ({items.length})</h2>
          <button
            onClick={close}
            aria-label="Close cart"
            className="rounded-full p-1.5 hover:bg-ink/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-ink-soft">Your bag is empty.</p>
            <Link
              href="/shop"
              onClick={close}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream hover:bg-signal transition-colors"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="divide-y hairline">
                {items.map((item) => (
                  <li key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-4 py-4">
                    <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-md bg-cream">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{item.name}</p>
                        <button
                          onClick={() => removeItem(item.productId, item.color, item.size)}
                          aria-label="Remove item"
                          className="text-ink-soft hover:text-signal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {(item.color || item.size) && (
                        <p className="mt-0.5 text-xs text-ink-soft">
                          {[item.color, item.size].filter(Boolean).join(" / ")}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 rounded-full border hairline px-1.5 py-1">
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1, item.color, item.size)
                            }
                            className="p-0.5 hover:text-signal"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-4 text-center text-xs">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1, item.color, item.size)
                            }
                            className="p-0.5 hover:text-signal"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t hairline px-6 py-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-ink-soft">Subtotal</span>
                <span className="text-lg font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={close}
                className="block w-full rounded-full bg-signal py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-paper hover:bg-signal-dark transition-colors"
              >
                Checkout
              </Link>
              <p className="mt-3 text-center text-xs text-ink-soft">
                Shipping & taxes calculated at checkout.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
