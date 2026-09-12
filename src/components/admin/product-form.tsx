"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import type { Category, Product } from "@prisma/client";
import { parseImages } from "@/lib/utils";

type Props = {
  categories: Category[];
  product?: Product;
};

export function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice?.toString() ?? "");
  const [images, setImages] = useState(product ? parseImages(product.images).join("\n") : "");
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [tags, setTags] = useState(product?.tags ?? "");
  const [colors, setColors] = useState(product?.colors ?? "");
  const [sizes, setSizes] = useState(product?.sizes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name,
      description,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      images: images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      stock: Number(stock),
      categoryId,
      featured,
      tags,
      colors,
      sizes,
    };

    try {
      const res = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save product.");
        setSubmitting(false);
        return;
      }
      toast.success(product ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Network error, please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Description
        </label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Price (₹)
          </label>
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Compare-at price (optional)
          </label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Image URLs (one per line)
        </label>
        <textarea
          required
          rows={3}
          value={images}
          onChange={(e) => setImages(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Stock quantity
          </label>
          <input
            required
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Tags (comma sep.)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="new, bestseller"
            className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Colors (comma sep.)
          </label>
          <input
            value={colors}
            onChange={(e) => setColors(e.target.value)}
            placeholder="Black, Sand"
            className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Sizes (comma sep.)
          </label>
          <input
            value={sizes}
            onChange={(e) => setSizes(e.target.value)}
            placeholder="S, M, L"
            className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
        Feature on homepage
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-ink px-7 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal disabled:opacity-60"
      >
        {submitting ? "Saving…" : product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
