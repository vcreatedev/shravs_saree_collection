"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { Category, Product } from "@prisma/client";
import { parseImages, parseList, parseSizeStock, parseColorVariants } from "@/lib/utils";
import { ImageUploader } from "./image-uploader";
import { TagInput } from "./tag-input";
import { SizeStockEditor, type SizeStockRow } from "./size-stock-editor";
import { ColorVariantsEditor, type VariantRow } from "./color-variants-editor";

const RATING_OPTIONS = ["3", "3.5", "4", "4.2", "4.5", "4.8", "5"];

type Props = {
  categories: Category[];
  product?: Product;
  availableColors: string[];
  availableSizes: string[];
  availableTags: string[];
};

export function ProductForm({ categories, product, availableColors, availableSizes, availableTags }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice?.toString() ?? "");
  const [images, setImages] = useState<string[]>(product ? parseImages(product.images) : []);
  const [flatStock, setFlatStock] = useState(product?.stock?.toString() ?? "0");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [tags, setTags] = useState<string[]>(product ? parseList(product.tags) : []);
  const [rating, setRating] = useState(product?.rating?.toString() ?? "4.5");
  const [colors, setColors] = useState<string[]>(product ? parseList(product.colors) : []);
  const [variants, setVariants] = useState<VariantRow[]>(product ? parseColorVariants(product.colorVariants) : []);
  const [sizeRows, setSizeRows] = useState<SizeStockRow[]>(() => {
    if (!product) return [];
    const stockMap = parseSizeStock(product.sizeStock);
    return parseList(product.sizes).map((size) => ({ size, stock: stockMap[size] ?? 0 }));
  });
  const ratingListId = useId();

  const sizeTotal = useMemo(() => sizeRows.reduce((sum, r) => sum + r.stock, 0), [sizeRows]);
  const usesSizes = sizeRows.length > 0;
  const usesColors = colors.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const relevantVariants = usesColors ? colors.map((c) => variants.find((v) => v.color === c) ?? { color: c, images: [], price: null }) : [];
    const finalImages = usesColors ? relevantVariants.flatMap((v) => v.images) : images;

    if (finalImages.length === 0) {
      toast.error(usesColors ? "Add at least one photo for at least one color." : "Add at least one product photo.");
      return;
    }
    setSubmitting(true);

    const sizeStock = usesSizes
      ? Object.fromEntries(sizeRows.map((r) => [r.size, r.stock]))
      : null;

    const payload = {
      name,
      description,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      images: finalImages,
      stock: usesSizes ? sizeTotal : Number(flatStock),
      categoryId,
      featured,
      rating: Number(rating),
      tags: tags.join(", "),
      colors: colors.join(", "),
      sizes: sizeRows.map((r) => r.size).join(", "),
      sizeStock,
      colorVariants: usesColors ? relevantVariants : null,
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

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Colors</label>
        <div className="mt-1.5">
          <TagInput values={colors} onChange={setColors} options={availableColors} placeholder="Select or type a color" />
        </div>
      </div>

      {usesColors ? (
        <ColorVariantsEditor
          colors={colors}
          variants={variants}
          onChange={setVariants}
          basePrice={Number(price) || 0}
          folderBase={categories.find((c) => c.id === categoryId)?.slug || "uploads"}
        />
      ) : (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Product photos
          </label>
          <div className="mt-1.5">
            <ImageUploader
              images={images}
              onChange={setImages}
              folder={categories.find((c) => c.id === categoryId)?.slug || "uploads"}
            />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Sizes {usesSizes && <span className="normal-case text-ink-soft">(with per-size stock)</span>}
        </label>
        <div className="mt-1.5">
          <SizeStockEditor rows={sizeRows} onChange={setSizeRows} options={availableSizes} />
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Leave sizes empty for a single, free-size item — you&apos;ll set its stock directly below instead.
        </p>
      </div>

      {!usesSizes && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Stock quantity
          </label>
          <input
            required
            type="number"
            min={0}
            value={flatStock}
            onChange={(e) => setFlatStock(e.target.value)}
            className="mt-1.5 w-full max-w-[160px] rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Tags</label>
          <div className="mt-1.5">
            <TagInput values={tags} onChange={setTags} options={availableTags} placeholder="e.g. new, bestseller" />
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            The <span className="font-medium">new</span> tag controls the storefront&apos;s
            &quot;New Arrivals&quot; link.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Star rating
          </label>
          <input
            list={ratingListId}
            type="number"
            min={0}
            max={5}
            step="0.1"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="Select or type, e.g. 4.7"
            className="mt-1.5 w-full max-w-[160px] rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
          />
          <datalist id={ratingListId}>
            {RATING_OPTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <p className="mt-2 text-xs text-ink-soft">
            Controls the storefront&apos;s &quot;Best Rated&quot; sort. Pick a common value or type any 0–5 rating.
          </p>
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
