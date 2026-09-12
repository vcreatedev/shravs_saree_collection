"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export function DeleteProductButton({ productId, name }: { productId: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setPending(true);
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Could not delete product.");
      setPending(false);
      return;
    }
    toast.success("Product deleted");
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Delete ${name}`}
      className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-signal/10 hover:text-signal disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
