"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import toast from "react-hot-toast";
import type { ProductWithCategory } from "@/types";
import { parseImages, parseList, parseSizeStock } from "@/lib/utils";

export function AddToCart({ product }: { product: ProductWithCategory }) {
  const colors = parseList(product.colors);
  const sizes = parseList(product.sizes);
  const sizeStock = useMemo(() => parseSizeStock(product.sizeStock), [product.sizeStock]);
  const hasSizeStock = sizes.length > 0 && Object.keys(sizeStock).length > 0;

  const [color, setColor] = useState(colors[0]);
  const [size, setSize] = useState(sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);
  const router = useRouter();
  const images = parseImages(product.images);

  const availableStock = hasSizeStock ? sizeStock[size] ?? 0 : product.stock;
  const outOfStock = availableStock === 0;

  function selectSize(s: string) {
    setSize(s);
    setQuantity(1);
  }

  function buildLine() {
    return {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: images[0] ?? "",
      price: product.price,
      quantity,
      color,
      size,
      stock: availableStock,
    };
  }

  function handleAdd() {
    addItem(buildLine());
    toast.success(`Added ${product.name} to bag`);
  }

  function handleBuyNow() {
    addItem(buildLine());
    openCart();
    router.push("/checkout");
  }

  return (
    <div className="space-y-6">
      {colors.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
            Color: <span className="text-ink">{color}</span>
          </p>
          <div className="mt-3 flex gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                  color === c ? "border-ink bg-ink text-cream" : "hairline hover:border-ink"
                }`}
              >
                {c}
              </button>
            ))}
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
  );
}
