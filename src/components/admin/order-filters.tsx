"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeStatus = searchParams.get("status") ?? "";

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
      <input
        value={value}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search order #, customer, email, or phone…"
        className="w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none sm:max-w-xs"
      />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setParam("status", null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
            !activeStatus ? "border-ink bg-ink text-cream" : "hairline hover:border-ink"
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setParam("status", activeStatus === s ? null : s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
              activeStatus === s ? "border-ink bg-ink text-cream" : "hairline hover:border-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
