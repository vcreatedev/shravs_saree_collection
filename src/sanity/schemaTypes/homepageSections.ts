import { defineField, defineType } from "sanity";

/* Shravs Saree Collection - single-document page sections, following VSN
   Vastraa's: the announcement strip above the header and the guarantees row
   in the footer. */

export const marqueeSectionType = defineType({
  name: "marqueeSection",
  title: "Announcement Strip",
  type: "document",
  fields: [
    defineField({
      name: "items",
      title: "Messages",
      type: "array",
      of: [{ type: "string" }],
      description: 'Short lines that scroll above the header, e.g. "🚚 Free shipping over ₹2,000".',
      validation: (rule) => rule.min(1).error("Add at least one message"),
    }),
  ],
  preview: { prepare: () => ({ title: "Announcement Strip" }) },
});

export const TRUST_BADGE_ICONS = [
  { title: "Truck (shipping)", value: "truck" },
  { title: "Award (quality)", value: "award" },
  { title: "Shield (secure payment)", value: "shield" },
  { title: "Arrows (returns)", value: "returns" },
  { title: "Heart", value: "heart" },
  { title: "Sparkles", value: "sparkles" },
];

export const trustBadgesSectionType = defineType({
  name: "trustBadgesSection",
  title: "Trust Badges",
  type: "document",
  fields: [
    defineField({
      name: "badges",
      title: "Badges",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "title", title: "Title", type: "string", description: "e.g. Free Shipping" }),
            defineField({ name: "subtitle", title: "Subtitle", type: "string", description: "e.g. Over ₹2,000" }),
            defineField({
              name: "icon",
              title: "Icon",
              type: "string",
              options: { list: TRUST_BADGE_ICONS },
              initialValue: "sparkles",
            }),
          ],
          preview: { select: { title: "title", subtitle: "subtitle" } },
        },
      ],
      validation: (rule) => rule.max(4).warning("The footer row is designed for four badges"),
    }),
  ],
  preview: { prepare: () => ({ title: "Trust Badges" }) },
});
