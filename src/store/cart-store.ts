"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types";

type CartState = {
  items: CartLine[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (item: CartLine) => void;
  removeItem: (productId: string, color?: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  clear: () => void;
};

function sameLine(a: CartLine, productId: string, color?: string, size?: string) {
  return a.productId === productId && a.color === color && a.size === size;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addItem: (item) => {
        const existing = get().items.find((i) => sameLine(i, item.productId, item.color, item.size));
        if (existing) {
          set({
            items: get().items.map((i) =>
              sameLine(i, item.productId, item.color, item.size)
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
        set({ isOpen: true });
      },
      removeItem: (productId, color, size) => {
        set({ items: get().items.filter((i) => !sameLine(i, productId, color, size)) });
      },
      updateQuantity: (productId, quantity, color, size) => {
        set({
          items: get()
            .items.map((i) =>
              sameLine(i, productId, color, size)
                ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
                : i
            )
            .filter((i) => i.quantity > 0),
        });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "shravs-cart" }
  )
);

export function cartSubtotal(items: CartLine[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartCount(items: CartLine[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
