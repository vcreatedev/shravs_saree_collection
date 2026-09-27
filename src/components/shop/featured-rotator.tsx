"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";
import type { ProductWithCategory } from "@/types";

const ROTATE_MS = 6000;

/** The homepage's Featured pieces grid, with the large spotlight slot taking
 * each product in turn: every ROTATE_MS the 2nd card glides up into the
 * spotlight, the rest move along one place, and the spotlight card travels
 * to the back of the line. Cards are keyed by product (not by slot) so each
 * one physically moves to its new place rather than slots swapping content. */
export function FeaturedRotator({ products }: { products: ProductWithCategory[] }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    const timeout = setTimeout(() => setOffset((o) => (o + 1) % products.length), ROTATE_MS);
    return () => clearTimeout(timeout);
  }, [offset, products.length]);

  const ordered = products.map((_, i) => products[(i + offset) % products.length]);

  return (
    <StaggerGroup className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {ordered.map((product, slot) => (
        // The incoming spotlight card is raised so it grows over the
        // outgoing one rather than underneath it.
        <StaggerItem key={product.id} className={slot === 0 ? "relative z-10 col-span-2 row-span-2" : ""}>
          <ProductCard product={product} layout />
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
