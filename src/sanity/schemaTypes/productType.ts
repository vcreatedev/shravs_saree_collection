import { defineArrayMember, defineField, defineType, getPublishedId } from "sanity";
import { codeKey } from "../../lib/product-code";

/* Shravs Saree Collection - product schema, following VSN Vastraa's, with
   sizes (blouses, frocks and dresses come in sizes) and parcel details for
   the courier partners. */
export const productType = defineType({
  name: "product",
  title: "Saree / Product",
  type: "document",
  groups: [
    { name: "general", title: "1. Overview", default: true },
    { name: "pricing", title: "2. Pricing & Stock" },
    { name: "craft", title: "3. Fabric & Details" },
    { name: "media", title: "4. Photos & Options" },
    { name: "merchandising", title: "5. Badges & Promotion" },
    { name: "shipping", title: "6. Shipping" },
    { name: "seo", title: "7. SEO & Social" },
  ],
  fields: [
    /* ── 1. Overview ── */
    defineField({
      name: "title",
      title: "Product Title",
      type: "string",
      group: "general",
      validation: (rule) => rule.required().error("Product title is required"),
    }),
    defineField({
      name: "slug",
      title: "Storefront Slug",
      type: "slug",
      group: "general",
      description: 'Unique URL handle (click "Generate" after typing the title)',
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required().error("Slug is required for the product page URL"),
    }),
    defineField({
      name: "productCode",
      title: "Product Code (SKU)",
      type: "string",
      group: "general",
      description: "Unique code shown on invoices, shipping labels and WhatsApp questions (e.g. SRV-001)",
      validation: (rule) => [
        rule.required().error("Product code is required"),
        /* refuses a code another product (draft or published) already has,
           ignoring case, dashes and spaces */
        rule.custom(async (code, context) => {
          if (!code || !context.document?._id) return true;
          const client = context.getClient({ apiVersion: "2026-02-01" });
          const others: { title?: string; productCode?: string }[] = await client.fetch(
            `*[_type == "product" && !sanity::versionOf($id) && defined(productCode)]{title, productCode}`,
            { id: getPublishedId(context.document._id) }
          );
          const taken = others.find((p) => codeKey(p.productCode) === codeKey(code));
          return taken
            ? `"${code.trim()}" is already used by "${taken.title || "another product"}". Product codes must be unique.`
            : true;
        }),
      ],
    }),
    defineField({
      name: "category",
      title: "Collection / Category",
      type: "reference",
      group: "general",
      to: [{ type: "category" }],
      validation: (rule) => rule.required().error("Please select a category"),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      group: "general",
      rows: 4,
    }),

    /* ── 2. Pricing & Stock ── */
    defineField({
      name: "price",
      title: "Selling Price (INR ₹)",
      type: "number",
      group: "pricing",
      description: "Price charged to the customer, e.g. 3499",
      validation: (rule) => rule.required().positive().error("Price must be a positive number"),
    }),
    defineField({
      name: "originalPrice",
      title: "MRP / Strike-through Price (INR ₹)",
      type: "number",
      group: "pricing",
      description: "Shown crossed out next to the price, with the % saved worked out automatically",
    }),
    defineField({
      name: "inStock",
      title: "Available to Buy",
      type: "boolean",
      group: "pricing",
      initialValue: true,
      description: 'Turn off to show it as "Sold out" whatever the stock count says',
    }),
    defineField({
      name: "stockQuantity",
      title: "Stock Quantity",
      type: "number",
      group: "pricing",
      initialValue: 5,
      description: "Pieces in stock. Goes down by itself as orders are paid. Ignored when sizes are listed below.",
      validation: (rule) => rule.min(0).integer(),
    }),
    defineField({
      name: "sizes",
      title: "Sizes",
      type: "array",
      group: "pricing",
      description: "For blouses, frocks and dresses. Leave empty for sarees. Each size keeps its own stock.",
      of: [
        defineArrayMember({
          type: "object",
          name: "sizeOption",
          fields: [
            defineField({ name: "size", title: "Size", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "stockQuantity",
              title: "Stock",
              type: "number",
              initialValue: 1,
              validation: (rule) => rule.required().min(0).integer(),
            }),
          ],
          preview: {
            select: { title: "size", stock: "stockQuantity" },
            prepare: ({ title, stock }) => ({ title, subtitle: `${stock ?? 0} in stock` }),
          },
        }),
      ],
    }),

    /* ── 3. Fabric & Details ── */
    defineField({ name: "fabric", title: "Fabric", type: "string", group: "craft", description: "e.g. Pure Georgette, Soft Silk" }),
    defineField({ name: "craft", title: "Work / Craft", type: "string", group: "craft", description: "e.g. Zari Border, Embroidered Yoke" }),
    defineField({ name: "color", title: "Color / Shade", type: "string", group: "craft", description: "e.g. Wine, Rose Print" }),
    defineField({ name: "blousePiece", title: "Blouse Piece", type: "string", group: "craft", description: "e.g. Unstitched matching blouse piece included" }),
    defineField({ name: "length", title: "Length / Dimensions", type: "string", group: "craft", description: "e.g. 5.5 m saree + 0.8 m blouse" }),
    defineField({ name: "washCare", title: "Wash Care", type: "string", group: "craft", description: "e.g. Dry clean only" }),
    defineField({ name: "occasion", title: "Occasion", type: "string", group: "craft", description: "e.g. Festive, Wedding Guest" }),

    /* ── 4. Photos & Options ── */
    defineField({
      name: "images",
      title: "Product Photos",
      type: "array",
      group: "media",
      description: "The first photo is the main one on cards and the product page.",
      of: [
        defineArrayMember({
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alt Text", type: "string", description: "e.g. Full drape view" }),
          ],
        }),
      ],
      validation: (rule) => rule.min(1).error("At least one product photo is required"),
    }),
    defineField({
      name: "hoverImage",
      title: "Hover Photo",
      type: "image",
      group: "media",
      options: { hotspot: true },
      description: "Shown when a shopper hovers the product card. Defaults to the second product photo.",
    }),
    defineField({
      name: "optionName",
      title: "Option Label",
      type: "string",
      group: "media",
      initialValue: "Color",
      description: 'What the options below are called on the product page, e.g. "Color" or "Design".',
    }),
    defineField({
      name: "variants",
      title: "Colour / Option Variants",
      type: "array",
      group: "media",
      description: "Each shade this piece comes in, with the photo shown when a shopper picks it.",
      of: [
        defineArrayMember({
          type: "object",
          name: "variant",
          fields: [
            defineField({ name: "name", title: "Option Name", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "image", title: "Photo", type: "image", options: { hotspot: true }, validation: (rule) => rule.required() }),
            defineField({ name: "inStock", title: "In Stock", type: "boolean", initialValue: true }),
          ],
          preview: { select: { title: "name", media: "image" } },
        }),
      ],
    }),

    /* ── 5. Badges & Promotion ── */
    defineField({
      name: "isNewArrival",
      title: "New Arrival",
      type: "boolean",
      group: "merchandising",
      initialValue: true,
      description: 'Listed in New Collections and New Arrivals with a "NEW" badge',
    }),
    defineField({
      name: "isBestSeller",
      title: "Best Seller",
      type: "boolean",
      group: "merchandising",
      initialValue: false,
      description: "Listed first in Best Sellers, with its rank",
    }),
    defineField({
      name: "isFeatured",
      title: "Featured",
      type: "boolean",
      group: "merchandising",
      initialValue: false,
      description: 'Comes first when shoppers sort the collections by "Featured"',
    }),
    defineField({
      name: "rating",
      title: "Average Customer Rating",
      type: "number",
      group: "merchandising",
      initialValue: 4.8,
      validation: (rule) => rule.min(1).max(5),
    }),
    defineField({ name: "reviews", title: "Customer Reviews Count", type: "number", group: "merchandising", initialValue: 0 }),

    /* ── 6. Shipping ── */
    defineField({
      name: "weightKg",
      title: "Packed Weight (kg)",
      type: "number",
      group: "shipping",
      initialValue: 0.5,
      description: "Couriers price by weight. Packed weight of one piece, e.g. 0.5",
      validation: (rule) => rule.min(0.05),
    }),
    defineField({
      name: "packageCm",
      title: "Packed Size (cm)",
      type: "object",
      group: "shipping",
      options: { columns: 3 },
      fields: [
        defineField({ name: "length", title: "Length", type: "number", initialValue: 30 }),
        defineField({ name: "breadth", title: "Breadth", type: "number", initialValue: 25 }),
        defineField({ name: "height", title: "Height", type: "number", initialValue: 5 }),
      ],
    }),

    /* ── 7. SEO & Social ── */
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      group: "seo",
      description: "Search engine title (defaults to the product title)",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      group: "seo",
      rows: 3,
      description: "Google search snippet, 150-160 characters",
    }),
  ],
  preview: {
    select: {
      title: "title",
      productCode: "productCode",
      price: "price",
      media: "images.0",
      isBestSeller: "isBestSeller",
      isNewArrival: "isNewArrival",
    },
    prepare({ title, productCode, price, media, isBestSeller, isNewArrival }) {
      const badges = [isBestSeller && "★ Best Seller", isNewArrival && "✦ New"].filter(Boolean);
      return {
        title: title || "Untitled product",
        subtitle: `${productCode || "No SKU"}${price ? ` · ₹${Number(price).toLocaleString("en-IN")}` : ""}${
          badges.length ? ` · ${badges.join(" ")}` : ""
        }`,
        media,
      };
    },
  },
});
