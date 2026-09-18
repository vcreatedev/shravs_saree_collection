"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

type Category = { id: string; name: string; slug: string };

const SECTIONS = [
  { value: "featured", label: "Featured (Homepage)" },
  { value: "new", label: "New Arrivals" },
  { value: "draft", label: "Drafts" },
];

export function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeSection = searchParams.get("section") ?? "";
  const activeCategory = searchParams.get("category") ?? "";

  function setParam(key: string, val: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(key, val);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSearchChange(next: string) {
    setValue(next);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setParam("q", next || null), 350);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:max-w-lg">
        <input
          value={value}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search title, description, or price…"
          className="w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
        />
        <select
          value={activeCategory}
          onChange={(e) => setParam("category", e.target.value || null)}
          className="w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none sm:max-w-[180px]"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setParam("section", null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
            !activeSection ? "border-ink bg-ink text-cream" : "hairline hover:border-ink"
          }`}
        >
          All
        </button>
        {SECTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setParam("section", activeSection === s.value ? null : s.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              activeSection === s.value ? "border-ink bg-ink text-cream" : "hairline hover:border-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
