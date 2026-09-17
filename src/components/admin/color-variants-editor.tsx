"use client";

import { ImageUploader } from "./image-uploader";
import { SizeStockEditor, type SizeStockRow } from "./size-stock-editor";
import { getSwatchColor, isLightSwatch } from "@/lib/color-swatches";

export type VariantRow = {
  color: string;
  images: string[];
  name: string | null;
  description: string | null;
  price: number | null;
  compareAtPrice: number | null;
  sizes: string | null;
  sizeStock: Record<string, number> | null;
};

type BaseProduct = {
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  sizeRows: SizeStockRow[];
};

type Props = {
  colors: string[];
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  base: BaseProduct;
  availableSizes: string[];
  folderBase: string;
};

function emptyVariant(color: string): VariantRow {
  return {
    color,
    images: [],
    name: null,
    description: null,
    price: null,
    compareAtPrice: null,
    sizes: null,
    sizeStock: null,
  };
}

export function ColorVariantsEditor({ colors, variants, onChange, base, availableSizes, folderBase }: Props) {
  if (colors.length === 0) return null;

  function getVariant(color: string): VariantRow {
    return variants.find((v) => v.color === color) ?? emptyVariant(color);
  }

  function updateVariant(color: string, patch: Partial<VariantRow>) {
    const existing = getVariant(color);
    const next = { ...existing, ...patch };
    const others = variants.filter((v) => v.color !== color);
    onChange([...others, next]);
  }

  function resetAllToBase() {
    onChange(
      colors.map((color) => ({
        ...getVariant(color),
        name: null,
        description: null,
        price: null,
        compareAtPrice: null,
        sizes: null,
        sizeStock: null,
      }))
    );
  }

  const baseSizeRowsAsRows = (): SizeStockRow[] => base.sizeRows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Details per color
        </p>
        <button
          type="button"
          onClick={resetAllToBase}
          className="whitespace-nowrap rounded-full border hairline px-3 py-1.5 text-xs font-semibold hover:border-ink"
        >
          Use base details for all colors
        </button>
      </div>

      <div className="space-y-5">
        {colors.map((color) => {
          const variant = getVariant(color);
          const hex = getSwatchColor(color);
          const isLight = isLightSwatch(hex);

          const usesBaseName = variant.name === null;
          const usesBaseDescription = variant.description === null;
          const usesBasePrice = variant.price === null;
          const usesBaseCompareAtPrice = variant.compareAtPrice === null;
          const usesBaseSizes = variant.sizes === null;

          const variantSizeRows: SizeStockRow[] = usesBaseSizes
            ? baseSizeRowsAsRows()
            : (variant.sizes ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => ({ size: s, stock: variant.sizeStock?.[s] ?? 0 }));

          return (
            <div key={color} className="rounded-xl border hairline p-4">
              <div className="flex items-center gap-2">
                <span
                  className={`h-5 w-5 rounded-full ${isLight ? "border border-line" : ""}`}
                  style={{ backgroundColor: hex }}
                />
                <p className="text-sm font-semibold">{color}</p>
              </div>

              <div className="mt-3">
                <ImageUploader
                  images={variant.images}
                  onChange={(images) => updateVariant(color, { images })}
                  folder={`${folderBase}/${color.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                />
              </div>

              <div className="mt-4 space-y-3 border-t hairline pt-3">
                <div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={usesBaseName}
                      onChange={(e) => updateVariant(color, { name: e.target.checked ? null : base.name })}
                    />
                    Use base title
                  </label>
                  {!usesBaseName && (
                    <input
                      value={variant.name ?? ""}
                      onChange={(e) => updateVariant(color, { name: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border hairline bg-paper px-3 py-2 text-xs focus:border-signal focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={usesBaseDescription}
                      onChange={(e) =>
                        updateVariant(color, { description: e.target.checked ? null : base.description })
                      }
                    />
                    Use base description
                  </label>
                  {!usesBaseDescription && (
                    <textarea
                      rows={3}
                      value={variant.description ?? ""}
                      onChange={(e) => updateVariant(color, { description: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border hairline bg-paper px-3 py-2 text-xs focus:border-signal focus:outline-none"
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={usesBasePrice}
                        onChange={(e) => updateVariant(color, { price: e.target.checked ? null : base.price })}
                      />
                      Use base price (₹{base.price || 0})
                    </label>
                    {!usesBasePrice && (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={variant.price ?? ""}
                        onChange={(e) => updateVariant(color, { price: Number(e.target.value) })}
                        className="mt-1.5 w-36 rounded-lg border hairline bg-paper px-3 py-1.5 text-xs focus:border-signal focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={usesBaseCompareAtPrice}
                        onChange={(e) =>
                          updateVariant(color, {
                            compareAtPrice: e.target.checked ? null : base.compareAtPrice ?? 0,
                          })
                        }
                      />
                      Use base compare-at price
                    </label>
                    {!usesBaseCompareAtPrice && (
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={variant.compareAtPrice ?? ""}
                        onChange={(e) => updateVariant(color, { compareAtPrice: Number(e.target.value) })}
                        className="mt-1.5 w-36 rounded-lg border hairline bg-paper px-3 py-1.5 text-xs focus:border-signal focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={usesBaseSizes}
                      onChange={(e) =>
                        updateVariant(
                          color,
                          e.target.checked
                            ? { sizes: null, sizeStock: null }
                            : {
                                sizes: base.sizeRows.map((r) => r.size).join(", "),
                                sizeStock: Object.fromEntries(base.sizeRows.map((r) => [r.size, r.stock])),
                              }
                        )
                      }
                    />
                    Use base sizes & stock
                  </label>
                  {!usesBaseSizes && (
                    <div className="mt-1.5">
                      <SizeStockEditor
                        rows={variantSizeRows}
                        onChange={(rows) =>
                          updateVariant(color, {
                            sizes: rows.map((r) => r.size).join(", "),
                            sizeStock: Object.fromEntries(rows.map((r) => [r.size, r.stock])),
                          })
                        }
                        options={availableSizes}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
