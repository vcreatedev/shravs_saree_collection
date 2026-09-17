"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";

export type SizeStockRow = { size: string; stock: number };

type Props = {
  rows: SizeStockRow[];
  onChange: (rows: SizeStockRow[]) => void;
  options: string[];
};

export function SizeStockEditor({ rows, onChange, options }: Props) {
  const [input, setInput] = useState("");
  const listId = useId();

  function addSize(raw: string) {
    const v = raw.trim();
    if (!v) return;
    if (rows.some((r) => r.size.toLowerCase() === v.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...rows, { size: v, stock: 0 }]);
    setInput("");
  }

  function updateStock(size: string, stock: number) {
    onChange(rows.map((r) => (r.size === size ? { ...r, stock: Math.max(0, stock) } : r)));
  }

  function removeSize(size: string) {
    onChange(rows.filter((r) => r.size !== size));
  }

  return (
    <div>
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rows.map((r) => (
            <div key={r.size} className="flex items-center gap-2 rounded-lg border hairline px-3 py-2">
              <span className="text-xs font-semibold uppercase">{r.size}</span>
              <input
                type="number"
                min={0}
                value={r.stock}
                onChange={(e) => updateStock(r.size, Number(e.target.value))}
                className="w-16 rounded border hairline bg-paper px-2 py-1 text-xs focus:border-signal focus:outline-none"
                aria-label={`Stock for size ${r.size}`}
              />
              <button
                type="button"
                onClick={() => removeSize(r.size)}
                aria-label={`Remove size ${r.size}`}
              >
                <X className="h-3.5 w-3.5 text-ink-soft hover:text-signal" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <input
          list={listId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSize(input);
            }
          }}
          placeholder="Select or type a size"
          className="flex-1 rounded-lg border hairline bg-paper px-3 py-2 text-sm focus:border-signal focus:outline-none"
        />
        <datalist id={listId}>
          {options.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={() => addSize(input)}
          className="rounded-lg border hairline px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:border-ink"
        >
          Add size
        </button>
      </div>
      {rows.length > 0 && (
        <p className="mt-2 text-xs text-ink-soft">
          Total stock across sizes: {rows.reduce((sum, r) => sum + r.stock, 0)}
        </p>
      )}
    </div>
  );
}
