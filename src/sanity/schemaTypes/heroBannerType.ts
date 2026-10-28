import { defineField, defineType } from "sanity";

/* Shravs Saree Collection - homepage hero slides, following VSN Vastraa's.
   Each document is one photo of the carousel; slides change every 5 seconds
   in "Slide Order". */
export const heroBannerType = defineType({
  name: "heroBanner",
  title: "Homepage Hero Slide",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Main Headline",
      type: "string",
      description: "Press Enter for a line break, e.g. Sarees, woven ⏎ with a story.",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "subtitle", title: "Eyebrow / Tagline", type: "string", description: "The gold line above the headline" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2, description: "Shown on tablets and computers" }),
    defineField({ name: "ctaText", title: "Button Text", type: "string", initialValue: "Shop the collection" }),
    defineField({
      name: "ctaLink",
      title: "Button Link",
      type: "string",
      initialValue: "/shop",
      description: "A page on this site, e.g. /shop or /shop?category=silk-sarees",
    }),
    defineField({ name: "secondaryCtaText", title: "Second Button Text (optional)", type: "string" }),
    defineField({ name: "secondaryCtaLink", title: "Second Button Link", type: "string" }),
    defineField({
      name: "productLink",
      title: "Photo Click Link (optional)",
      type: "string",
      description: "Opens when the photo is clicked, e.g. /product/wine-chevron-silk-saree",
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mobileImage",
      title: "Phone Photo (optional)",
      type: "image",
      options: { hotspot: true },
      description: "A taller crop for phones. Defaults to the photo above.",
    }),
    defineField({ name: "isActive", title: "Show on Storefront", type: "boolean", initialValue: true }),
    defineField({ name: "order", title: "Slide Order", type: "number", initialValue: 1 }),
  ],
  preview: {
    select: { title: "title", subtitle: "subtitle", media: "image", isActive: "isActive", order: "order" },
    prepare: ({ title, subtitle, media, isActive, order }) => ({
      title: title || "Untitled slide",
      subtitle: `${order ?? "-"} · ${isActive ? "● Showing" : "○ Hidden"}${subtitle ? ` · ${subtitle}` : ""}`,
      media,
    }),
  },
});
