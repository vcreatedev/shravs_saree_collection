"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Category } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { ImageUploader } from "./image-uploader";

function openPreview(payload: {
  type: "category";
  published: boolean;
  data: { id: string; name: string; slug: string; image: string | null; image2: string | null };
}) {
  try {
    sessionStorage.setItem("adminPreview", JSON.stringify(payload));
  } catch {
    toast.error("Could not open preview.");
    return;
  }
  // No noopener/noreferrer here on purpose - this is our own same-origin
  // route, and keeping the opener link is what lets the new tab inherit a
  // copy of this tab's sessionStorage (where the preview data just went).
  window.open("/preview", "_blank");
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  // New categories start as a draft - previewable, published only when
  // explicitly checked.
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, image: images[0] || "", image2: images[1] || "", published }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not create category.");
      setSubmitting(false);
      return;
    }
    toast.success(published ? "Category created" : "Saved as draft — preview it before publishing");
    setName("");
    setImages([]);
    setPublished(false);
    setSubmitting(false);
    router.refresh();
  }

  function handlePreviewNew() {
    if (!name.trim()) {
      toast.error("Add a name first.");
      return;
    }
    openPreview({
      type: "category",
      published,
      data: { id: "preview", name, slug: slugify(name), image: images[0] ?? null, image2: images[1] ?? null },
    });
  }

  return (
    // minmax(0, ...): the list column keeps to the space it's given instead of
    // stretching to fit its widest row, which pushed everything past a phone's edge.
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            open={openId === cat.id}
            onToggle={() => setOpenId(openId === cat.id ? null : cat.id)}
          />
        ))}
        {categories.length === 0 && (
          <div className="rounded-2xl border hairline bg-paper px-5 py-10 text-center text-sm text-ink-soft">
            No categories yet.
          </div>
        )}
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
            Cover photos (optional, up to 2)
          </label>
          <div className="mt-1.5">
            <ImageUploader
              images={images}
              onChange={setImages}
              folder={name ? slugify(name) : "categories"}
              multiple
              max={2}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Published
          </label>
          <button
            type="button"
            onClick={handlePreviewNew}
            className="rounded-full border hairline px-3 py-1 text-xs font-semibold hover:border-ink"
          >
            Preview →
          </button>
        </div>
        <p className="text-xs text-ink-soft">
          {published ? "Live once saved." : "Draft — hidden from shoppers."} Preview shows exactly how
          it&rsquo;ll look right now, including unsaved edits — only you can see this, never shoppers.
        </p>
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

function CategoryCard({
  category,
  open,
  onToggle,
}: {
  category: Category;
  open: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [images, setImages] = useState<string[]>(
    [category.image, category.image2].filter((i): i is string => Boolean(i))
  );
  const [published, setPublished] = useState(category.published);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);

  function handlePreview() {
    if (!name.trim()) {
      toast.error("Add a name first.");
      return;
    }
    openPreview({
      type: "category",
      published,
      data: { id: category.id, name, slug: category.slug, image: images[0] ?? null, image2: images[1] ?? null },
    });
  }

  async function handleQuickPublishToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (togglingPublish) return;
    const next = !published;
    setTogglingPublish(true);
    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: next }),
    });
    if (!res.ok) {
      toast.error("Could not update category.");
      setTogglingPublish(false);
      return;
    }
    setPublished(next);
    toast.success(next ? "Category published" : "Category set to draft");
    setTogglingPublish(false);
    router.refresh();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      toast.error("Add a name.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, image: images[0] || "", image2: images[1] || "", published }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Could not save category.");
      setSaving(false);
      return;
    }
    toast.success("Category saved");
    setSaving(false);
    router.refresh();
  }

  async function handleDelete() {
    if (deleting) return;
    if (!confirm(`Delete category "${category.name}"?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Could not delete category.");
      setDeleting(false);
      return;
    }
    toast.success("Category deleted");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border hairline bg-paper">
      {/* The buttons wrap onto a second line, right-aligned, when the row is
          too narrow for name and buttons side by side (phones, and next to
          the New category form on smaller laptops). */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-3">
        <button type="button" onClick={onToggle} className="flex flex-1 basis-48 items-center gap-3 text-left">
          <div>
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-ink-soft">/{category.slug}</p>
          </div>
          {!published && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold">
              Draft
            </span>
          )}
          <span className="ml-auto flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {open ? "Close" : "Edit"}
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={handlePreview}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-ink/5"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleQuickPublishToggle}
            disabled={togglingPublish}
            className={`flex-shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors disabled:opacity-50 ${
              published
                ? "border-forest/30 bg-forest/10 text-forest hover:bg-forest/15"
                : "border-gold/30 bg-gold/10 text-gold hover:bg-gold/15"
            }`}
          >
            {published ? "Published" : "Draft"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`Delete ${category.name}`}
            className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-signal/10 hover:text-signal disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={handleSave} className="space-y-4 border-t hairline px-5 py-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border hairline bg-cream/40 px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Cover photos (up to 2)
            </label>
            <div className="mt-1.5">
              <ImageUploader images={images} onChange={setImages} folder={category.slug} multiple max={2} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              Published
            </label>
            <button
              type="button"
              onClick={handlePreview}
              className="rounded-full border hairline px-3 py-1 text-xs font-semibold hover:border-ink"
            >
              Preview →
            </button>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-ink px-7 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </div>
  );
}
