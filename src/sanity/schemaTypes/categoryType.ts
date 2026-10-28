import { defineField, defineType } from "sanity";

/* Shravs Saree Collection - collection / category, following VSN Vastraa's. */
export const categoryType = defineType({
  name: "category",
  title: "Collection / Category",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Collection Title",
      type: "string",
      description: "e.g. Sarees, Silk Sarees, Anarkali & Gowns",
      validation: (rule) => rule.required().error("Category title is required"),
    }),
    defineField({
      name: "slug",
      title: "Collection URL Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required().error("Slug is required"),
    }),
    defineField({ name: "subtitle", title: "Subtitle", type: "string" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({
      name: "image",
      title: "Cover Photo",
      type: "image",
      options: { hotspot: true },
      description: "The round photo in Shop by Category",
    }),
    defineField({
      name: "orderRank",
      title: "Display Order",
      type: "number",
      initialValue: 0,
      description: "Lower numbers come first in Shop by Category and the collections filter",
    }),
  ],
  preview: { select: { title: "title", subtitle: "subtitle", media: "image" } },
});
