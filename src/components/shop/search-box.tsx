"use client";

import { LoaderCircle, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

const DEBOUNCE_MS = 350;

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  const [focused, setFocused] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Follow the URL when something else changes it (Clear all, back/forward) -
  // but not while typing: the results for "silk" landing mid-word would
  // otherwise wipe out whatever was typed after it.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    if (!focused) setValue(urlQuery);
  }

  // A search still waiting on its debounce must not fire after leaving the page.
  useEffect(() => () => clearTimeout(timeout.current), []);

  function search(next: string) {
    clearTimeout(timeout.current);
    const q = next.trim();
    // Only trailing spaces changed (a pause between words) - same results.
    if (q === urlQuery) return;
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    // replace, not push: one history entry per search, not one per pause.
    // The transition keeps the current results up (dimmed) until the new
    // ones arrive, instead of blanking the page.
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  function handleChange(next: string) {
    setValue(next);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => search(next), DEBOUNCE_MS);
  }

  return (
    <form
      role="search"
      data-pending={isPending ? "" : undefined}
      onSubmit={(e) => {
        e.preventDefault();
        search(value);
      }}
      className="relative w-full max-w-xs"
    >
      {isPending ? (
        <LoaderCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-signal" />
      ) : (
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      )}
      <input
        type="search"
        enterKeyHint="search"
        aria-label="Search products"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search products…"
        className="w-full rounded-full border hairline bg-paper py-2.5 pl-9 pr-4 text-sm focus:border-signal focus:outline-none"
      />
    </form>
  );
}
