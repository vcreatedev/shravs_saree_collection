"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

/** A pill that shows Published/Draft status and doubles as the control -
 * click it to flip state right there in a listing, no need to open the item. */
export function PublishToggle({
  published,
  endpoint,
  itemLabel,
}: {
  published: boolean;
  endpoint: string;
  itemLabel: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(published);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const next = !current;
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: next }),
      });
      if (!res.ok) {
        toast.error(`Could not update ${itemLabel}.`);
        return;
      }
      setCurrent(next);
      toast.success(next ? `${itemLabel} published` : `${itemLabel} set to draft`);
      router.refresh();
    } catch {
      toast.error("Network error, please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={current ? `Unpublish ${itemLabel}` : `Publish ${itemLabel}`}
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-50 ${
        current
          ? "border-forest/30 bg-forest/10 text-forest hover:bg-forest/15"
          : "border-gold/30 bg-gold/10 text-gold hover:bg-gold/15"
      }`}
    >
      {current ? "Published" : "Draft"}
    </button>
  );
}
