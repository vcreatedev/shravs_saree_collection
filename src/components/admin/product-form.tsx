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
import type { ProductWithCategory } from "@/types";

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
  // New products start as a draft - published only when the admin explicitly
  // checks it, after previewing. Editing an existing product keeps its
  // current state.
  const [published, setPublished] = useState(product?.published ?? false);
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

  // Shared by both submit and the live Preview panel, so preview always
  // reflects exactly what Save would send.
  const relevantVariants = useMemo(
    () =>
      usesColors
        ? colors.map(
            (c) =>
              variants.find((v) => v.color === c) ?? {
                color: c,
                images: [],
                name: null,
                description: null,
                price: null,
                compareAtPrice: null,
                sizes: null,
                sizeStock: null,
                tags: null,
                rating: null,
              }
          )
        : [],
    [usesColors, colors, variants]
  );
  const finalImages = usesColors ? relevantVariants.flatMap((v) => v.images) : images;
  const sizeStock = usesSizes ? Object.fromEntries(sizeRows.map((r) => [r.size, r.stock])) : null;

  // Not persisted anywhere - only used to feed the real ProductPurchase
  // component for the in-admin Preview panel, so what you see there is
  // pixel-for-pixel what the real page renders once saved.
  const previewProduct: ProductWithCategory = useMemo(
    () => ({
      id: product?.id ?? "preview",
      slug: product?.slug ?? "preview",
      name,
      description,
      price: Number(price) || 0,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      images: JSON.stringify(finalImages),
      stock: usesSizes ? sizeTotal : Number(flatStock) || 0,
      rating: Number(rating) || 0,
      reviewCount: product?.reviewCount ?? 0,
      featured,
      published,
      tags: tags.join(", "),
      colors: colors.join(", "),
      sizes: sizeRows.map((r) => r.size).join(", "),
      sizeStock,
      colorVariants: usesColors ? relevantVariants : null,
      categoryId,
      category: categories.find((c) => c.id === categoryId) ?? categories[0],
      createdAt: product?.createdAt ?? new Date(),
      updatedAt: new Date(),
    }),
    [
      product,
      name,
      description,
      price,
      compareAtPrice,
      finalImages,
      usesSizes,
      sizeTotal,
      flatStock,
      rating,
      featured,
      published,
      tags,
      colors,
      sizeRows,
      sizeStock,
      usesColors,
      relevantVariants,
      categoryId,
      categories,
    ]
  );

  function handlePreview() {
    if (finalImages.length === 0) {
      toast.error(usesColors ? "Add at least one photo for at least one color first." : "Add at least one product photo first.");
      return;
    }
    try {
      sessionStorage.setItem(
        "adminPreview",
        JSON.stringify({ type: "product", published, data: previewProduct })
      );
    } catch {
      toast.error("Could not open preview.");
      return;
    }
    // No noopener/noreferrer here on purpose - this is our own same-origin
    // route, and keeping the opener link is what lets the new tab inherit a
    // copy of this tab's sessionStorage (where the preview data just went).
    window.open("/preview", "_blank");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (finalImages.length === 0) {
      toast.error(usesColors ? "Add at least one photo for at least one color." : "Add at least one product photo.");
      return;
    }
    setSubmitting(true);

    const payload = {
      name,
      description,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      images: finalImages,
      stock: usesSizes ? sizeTotal : Number(flatStock),
      categoryId,
      featured,
      published,
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
      toast.success(
        product ? "Product updated" : published ? "Product created" : "Saved as draft — preview it before publishing"
      );
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
          base={{
            name,
            description,
            price: Number(price) || 0,
            compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
            sizeRows,
            tags,
            rating: Number(rating) || 0,
          }}
          availableSizes={availableSizes}
          availableTags={availableTags}
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
            <span className="font-medium">new</span> pins a product to the top of &quot;New
            Arrivals&quot;; <span className="font-medium">bestseller</span> or{" "}
            <span className="font-medium">best rated</span> pins it to the top of &quot;Best
            Rated&quot; — the rest of the catalog still shows below, sorted by rating.
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

      <div className="space-y-2 rounded-lg border hairline bg-paper p-4">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Published
          </label>
          <button
            type="button"
            onClick={handlePreview}
            className="rounded-full border hairline px-3 py-1 text-xs font-semibold hover:border-ink"
          >
            Preview →
          </button>
        </div>
        <p className="text-xs text-ink-soft">
          {published ? "Live once saved." : "Draft — hidden from shoppers."} Preview shows exactly how
          it&rsquo;ll look right now, including unsaved edits, and flags whether it&rsquo;s currently
          published or still a draft — only you can see this, never shoppers.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Feature on homepage
        </label>
      </div>

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
