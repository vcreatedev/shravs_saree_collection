"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Category } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { ImageUploader } from "./image-uploader";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, image: images[0] || "" }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not create category.");
      setSubmitting(false);
      return;
    }
    toast.success("Category created");
    setName("");
    setImages([]);
    setSubmitting(false);
    router.refresh();
  }

  async function handleDelete(id: string, catName: string) {
    if (!confirm(`Delete category "${catName}"?`)) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Could not delete category.");
      return;
    }
    toast.success("Category deleted");
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border hairline bg-paper">
        <ul className="divide-y hairline">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium">{cat.name}</p>
                <p className="text-xs text-ink-soft">/{cat.slug}</p>
              </div>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                aria-label={`Delete ${cat.name}`}
                className="rounded-lg p-2 text-ink-soft hover:bg-signal/10 hover:text-signal"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {categories.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-ink-soft">No categories yet.</li>
          )}
        </ul>
      </div>

      <form onSubmit={handleCreate} className="h-max space-y-4 rounded-2xl border hairline bg-paper p-5">
        <h2 className="font-display text-lg italic">New category</h2>
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border hairline bg-cream/40 px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
        />
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Cover photo (optional)
          </label>
          <div className="mt-1.5">
            <ImageUploader
              images={images}
              onChange={setImages}
              folder={name ? slugify(name) : "categories"}
              multiple={false}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-cream hover:bg-signal disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add category"}
        </button>
      </form>
    </div>
  );
}
