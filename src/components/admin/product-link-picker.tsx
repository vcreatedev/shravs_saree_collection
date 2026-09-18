"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import type { SiteLink } from "@/lib/hero";

type Props = {
  value: string;
  onChange: (href: string) => void;
  options: SiteLink[];
  placeholder?: string;
};

export function ProductLinkPicker({ value, onChange, options, placeholder }: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedLabel = options.find((o) => o.href === value)?.label ?? "";
  const [query, setQuery] = useState(selectedLabel);

  function commit(raw: string) {
    const trimmed = raw.trim();
    if (trimmed === "") {
      onChange("");
      setQuery("");
      return;
    }
    const match = options.find((o) => o.label.toLowerCase() === trimmed.toLowerCase());
    if (match) {
      onChange(match.href);
      setQuery(match.label);
    } else {
      // Not a real product - revert instead of accepting free text.
      setQuery(selectedLabel);
    }
  }

  // Keep a ref to the latest commit so the native listener below (bound
  // once) never closes over a stale options/onChange from an earlier render.
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    // Picking a <datalist> option fires the native "change" event immediately.
    // React's onChange prop maps to the native "input" event instead, which
    // fires on every keystroke too, so it can't tell a datalist pick apart
    // from ordinary typing - listening to the real "change" event lets a
    // dropdown click select the product right away.
    function handleNativeChange(e: Event) {
      commitRef.current((e.target as HTMLInputElement).value);
    }
    el.addEventListener("change", handleNativeChange);
    return () => el.removeEventListener("change", handleNativeChange);
  }, []);

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        list={listId}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        placeholder={placeholder ?? "Search products…"}
        className="flex-1 rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
      />
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o.href} value={o.label} />
        ))}
      </datalist>
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setQuery("");
          }}
          aria-label="Clear product link"
          className="rounded-lg border hairline px-3 py-2 text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
