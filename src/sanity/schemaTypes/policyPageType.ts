import { defineField, defineType } from "sanity";

/** A heading and its text - one block of a policy or contact page. In the
 * text, a blank line starts a new paragraph, lines starting with "- " become
 * a bulleted list, and [words](/address) become a link. */
export const pageSectionField = defineField({
  name: "sections",
  title: "Page Sections",
  type: "array",
  of: [
    {
      type: "object",
      name: "sectionItem",
      fields: [
        defineField({ name: "title", title: "Section Heading", type: "string", validation: (rule) => rule.required() }),
        defineField({
          name: "content",
          title: "Section Text",
          type: "text",
          rows: 6,
          description: 'A blank line starts a new paragraph. Lines starting with "- " become a bulleted list. Write a link as [link text](/page-address).',
          validation: (rule) => rule.required(),
        }),
      ],
      preview: { select: { title: "title", subtitle: "content" } },
    },
  ],
});

/* Shravs Saree Collection - policy pages (Shipping, Returns, Privacy, Terms),
   following VSN Vastraa's. The slug is the page's address, e.g.
   "shipping-policy" for /shipping-policy. */
export const policyPageType = defineType({
  name: "policyPage",
  title: "Policy & Legal Page",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Page Title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      title: "Slug (page address)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      description: "shipping-policy, refund-policy, privacy-policy or terms-and-conditions",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "intro", title: "Introduction", type: "text", rows: 3 }),
    defineField({ name: "updatedDate", title: "Last Updated", type: "string", description: "e.g. 20 September 2026" }),
    pageSectionField,
  ],
  preview: {
    select: { title: "title", slug: "slug.current" },
    prepare: ({ title, slug }) => ({ title: title || "Policy page", subtitle: slug ? `/${slug}` : "Draft" }),
  },
});

/* The Contact Us page's own words. The phone, email, WhatsApp number,
   location and hours on it come from Storefront Settings, so they're kept in
   one place. */
export const contactPageType = defineType({
  name: "contactPage",
  title: "Contact Us Page",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Page Title", type: "string", initialValue: "Contact Us", validation: (rule) => rule.required() }),
    defineField({
      name: "intro",
      title: "Introduction",
      type: "text",
      rows: 3,
      description: "Shown above the WhatsApp button",
    }),
    defineField({ name: "whatsappButtonText", title: "WhatsApp Button Text", type: "string", initialValue: "Chat with us on WhatsApp" }),
    defineField({ name: "mapsUrl", title: "Google Maps Link (optional)", type: "url" }),
    defineField({ name: "updatedDate", title: "Last Updated", type: "string" }),
    { ...pageSectionField, title: "More Sections", description: "Extra blocks shown below the contact details" },
  ],
  preview: { select: { title: "title" } },
});
