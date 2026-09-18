"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { ImageUploader } from "./image-uploader";
import { ProductLinkPicker } from "./product-link-picker";
import type { SiteLink } from "@/lib/hero";

type Slide = {
  id: string;
  tagline: string;
  heading: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  productHref: string;
  images: string[];
};

export function HeroSlidesManager({
  slides,
  linkOptions,
  productOptions,
}: {
  slides: Slide[];
  linkOptions: SiteLink[];
  productOptions: SiteLink[];
}) {
  const [drafts, setDrafts] = useState<Slide[]>([]);
  const [openId, setOpenId] = useState<string | null>(slides[0]?.id ?? null);

  function addSection() {
    const base = slides[0];
    const draft: Slide = {
      id: `draft-${Date.now()}`,
      tagline: base?.tagline ?? "New section",
      heading: base?.heading ?? "Your heading here",
      description: base?.description ?? "Describe this section of the homepage.",
      primaryLabel: base?.primaryLabel ?? "Shop the collection",
      primaryHref: base?.primaryHref ?? linkOptions[0]?.href ?? "/shop",
      secondaryLabel: base?.secondaryLabel ?? "",
      secondaryHref: base?.secondaryHref ?? "",
      productHref: base?.productHref ?? "",
      images: base?.images ?? [],
    };
    setDrafts((d) => [...d, draft]);
    setOpenId(draft.id);
  }

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <HeroSlideCard
          key={slide.id}
          slide={slide}
          index={i}
          linkOptions={linkOptions}
          productOptions={productOptions}
          open={openId === slide.id}
          onToggle={() => setOpenId(openId === slide.id ? null : slide.id)}
          allowDelete={slides.length > 1}
          isNew={false}
        />
      ))}

      {drafts.map((draft, i) => (
        <HeroSlideCard
          key={draft.id}
          slide={draft}
          index={slides.length + i}
          linkOptions={linkOptions}
          productOptions={productOptions}
          open={openId === draft.id}
          onToggle={() => setOpenId(openId === draft.id ? null : draft.id)}
          allowDelete
          isNew
          onDiscard={() => setDrafts((d) => d.filter((x) => x.id !== draft.id))}
          onCreated={() => setDrafts((d) => d.filter((x) => x.id !== draft.id))}
        />
      ))}

      <button
        type="button"
        onClick={addSection}
        className="flex items-center gap-2 rounded-full border-2 border-dashed hairline px-5 py-3 text-sm font-semibold uppercase tracking-wide text-ink-soft transition-colors hover:border-ink hover:text-ink"
      >
        <Plus className="h-4 w-4" /> Add new section
      </button>
    </div>
  );
}

function HeroSlideCard({
  slide,
  index,
  linkOptions,
  productOptions,
  open,
  onToggle,
  allowDelete,
  isNew,
  onDiscard,
  onCreated,
}: {
  slide: Slide;
  index: number;
  linkOptions: SiteLink[];
  productOptions: SiteLink[];
  open: boolean;
  onToggle: () => void;
  allowDelete: boolean;
  isNew: boolean;
  onDiscard?: () => void;
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tagline, setTagline] = useState(slide.tagline);
  const [heading, setHeading] = useState(slide.heading);
  const [description, setDescription] = useState(slide.description);
  const [primaryLabel, setPrimaryLabel] = useState(slide.primaryLabel);
  const [primaryHref, setPrimaryHref] = useState(slide.primaryHref);
  const [secondaryLabel, setSecondaryLabel] = useState(slide.secondaryLabel);
  const [secondaryHref, setSecondaryHref] = useState(slide.secondaryHref);
  const [productHref, setProductHref] = useState(slide.productHref);
  const [images, setImages] = useState<string[]>(slide.images);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (images.length === 0) {
      toast.error("Add at least one image.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(isNew ? "/api/admin/hero" : `/api/admin/hero/${slide.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline,
          heading,
          description,
          primaryLabel,
          primaryHref,
          secondaryLabel,
          secondaryHref,
          productHref,
          images,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not save this section.");
        return;
      }
      toast.success(isNew ? "Section added" : "Section saved");
      if (isNew) onCreated?.();
      router.refresh();
    } catch {
      toast.error("Network error, please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (isNew) {
      onDiscard?.();
      return;
    }
    if (deleting) return;
    if (!confirm("Remove this homepage section?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/hero/${slide.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not remove this section.");
        return;
      }
      toast.success("Section removed");
      router.refresh();
    } catch {
      toast.error("Network error, please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`rounded-2xl border bg-paper ${isNew ? "border-2 border-dashed border-signal" : "hairline"}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Section {index + 1} {isNew && <span className="text-signal">· not saved yet</span>}
          </p>
          <p className="mt-0.5 font-medium">{tagline || "Untitled section"}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <form onSubmit={handleSave} className="space-y-5 border-t hairline px-5 py-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Slideshow images
            </label>
            <div className="mt-1.5">
              <ImageUploader images={images} onChange={setImages} folder="homepage" />
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              One image shows a static banner for this section. Add two or more and they&apos;ll
              fade between each other.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Clicking the image opens
            </label>
            <div className="mt-1.5">
              <ProductLinkPicker
                value={productHref}
                onChange={setProductHref}
                options={productOptions}
                placeholder="Search products… (leave blank for not clickable)"
              />
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              Pick one of your existing products to feature — clicking the photo takes shoppers
              straight to that product, while the buttons below still go to their own link.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Eyebrow tag
            </label>
            <input
              required
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Heading
            </label>
            <textarea
              required
              rows={2}
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
            />
            <p className="mt-2 text-xs text-ink-soft">
              Use a line break for a second line, e.g. &quot;Sarees, woven / with a story.&quot;
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Primary button label
              </label>
              <input
                required
                value={primaryLabel}
                onChange={(e) => setPrimaryLabel(e.target.value)}
                className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Primary button links to
              </label>
              <select
                required
                value={primaryHref}
                onChange={(e) => setPrimaryHref(e.target.value)}
                className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
              >
                {linkOptions.map((l) => (
                  <option key={l.href} value={l.href}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Secondary link label (optional)
              </label>
              <input
                value={secondaryLabel}
                onChange={(e) => setSecondaryLabel(e.target.value)}
                className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Secondary link links to
              </label>
              <select
                value={secondaryHref}
                onChange={(e) => setSecondaryHref(e.target.value)}
                className="mt-1.5 w-full rounded-lg border hairline bg-paper px-4 py-2.5 text-sm focus:border-signal focus:outline-none"
              >
                <option value="">No secondary link</option>
                {linkOptions.map((l) => (
                  <option key={l.href} value={l.href}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-ink px-7 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save section"}
            </button>
            {allowDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-signal hover:text-signal-dark disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />{" "}
                {isNew ? "Discard" : deleting ? "Removing…" : "Remove section"}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
