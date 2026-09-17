"use client";

import { ImageUploader } from "./image-uploader";
import { getSwatchColor, isLightSwatch } from "@/lib/color-swatches";

export type VariantRow = { color: string; images: string[]; price: number | null };

type Props = {
  colors: string[];
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  basePrice: number;
  folderBase: string;
};

export function ColorVariantsEditor({ colors, variants, onChange, basePrice, folderBase }: Props) {
  if (colors.length === 0) return null;

  function getVariant(color: string): VariantRow {
    return variants.find((v) => v.color === color) ?? { color, images: [], price: null };
  }

  function updateVariant(color: string, patch: Partial<VariantRow>) {
    const existing = getVariant(color);
    const next = { ...existing, ...patch };
    const others = variants.filter((v) => v.color !== color);
    onChange([...others, next]);
  }

  function resetAllToBasePrice() {
    onChange(colors.map((color) => ({ ...getVariant(color), price: null })));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Photos & price per color
        </p>
        <button
          type="button"
          onClick={resetAllToBasePrice}
          className="whitespace-nowrap rounded-full border hairline px-3 py-1.5 text-xs font-semibold hover:border-ink"
        >
          Use ₹{basePrice || 0} for all colors
        </button>
      </div>

      <div className="space-y-4">
        {colors.map((color) => {
          const variant = getVariant(color);
          const usesBasePrice = variant.price === null;
          const hex = getSwatchColor(color);
          const isLight = isLightSwatch(hex);

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

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={usesBasePrice}
                    onChange={(e) => updateVariant(color, { price: e.target.checked ? null : basePrice })}
                  />
                  Use base price
                </label>
                {!usesBasePrice && (
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={variant.price ?? ""}
                    onChange={(e) => updateVariant(color, { price: Number(e.target.value) })}
                    placeholder="Price for this color"
                    className="w-36 rounded-lg border hairline bg-paper px-3 py-1.5 text-xs focus:border-signal focus:outline-none"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
