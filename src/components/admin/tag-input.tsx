"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";

type Props = {
  values: string[];
  onChange: (values: string[]) => void;
  options: string[];
  placeholder?: string;
};

export function TagInput({ values, onChange, options, placeholder }: Props) {
  const [input, setInput] = useState("");
  const listId = useId();

  function addValue(raw: string) {
    const v = raw.trim();
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...values, v]);
    setInput("");
  }

  function removeValue(v: string) {
    onChange(values.filter((x) => x !== v));
  }

  return (
    <div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-medium"
            >
              {v}
              <button type="button" onClick={() => removeValue(v)} aria-label={`Remove ${v}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
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
              addValue(input);
            }
          }}
          placeholder={placeholder ?? "Select or type…"}
          className="flex-1 rounded-lg border hairline bg-paper px-3 py-2 text-sm focus:border-signal focus:outline-none"
        />
        <datalist id={listId}>
          {options.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <button
          type="button"
          onClick={() => addValue(input)}
          className="rounded-lg border hairline px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:border-ink"
        >
          Add
        </button>
      </div>
    </div>
  );
}
