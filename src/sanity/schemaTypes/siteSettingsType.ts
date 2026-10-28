import { defineField, defineType } from "sanity";

/* Shravs Saree Collection - storefront settings, following VSN Vastraa's:
   brand, contact details, footer, and how orders are delivered. One document
   (id "siteSettings"). */
export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Storefront Settings",
  type: "document",
  groups: [
    { name: "brand", title: "Brand", default: true },
    { name: "contact", title: "Contact" },
    { name: "footer", title: "Footer & Social" },
    { name: "delivery", title: "Shipping & Delivery" },
  ],
  fields: [
    /* ── Brand ── */
    defineField({
      name: "storeName",
      title: "Store Name",
      type: "string",
      group: "brand",
      initialValue: "Shravs Saree Collection",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "tagline", title: "Tagline", type: "string", group: "brand", initialValue: "Handpicked sarees, for every occasion" }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      group: "brand",
      description:
        "Square, at least 512 × 512 px. Shown in the header, footer and loading screen, as the browser tab and phone home-screen icon, in the Studio, and when links to the shop are shared.",
      validation: (rule) => rule.required(),
    }),

    /* ── Contact ── */
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp Number (digits with country code, no +)",
      type: "string",
      group: "contact",
      description: "Every WhatsApp button opens a chat with this number, e.g. 919121238445",
      validation: (rule) => rule.required().regex(/^\d{10,15}$/, { name: "digits only" }),
    }),
    defineField({
      name: "whatsappDefaultMessage",
      title: "WhatsApp Greeting",
      type: "string",
      group: "contact",
      description: "Pre-filled message when a shopper opens WhatsApp from the site",
    }),
    defineField({ name: "displayPhone", title: "Phone Number (as shown)", type: "string", group: "contact", description: "e.g. +91 91212 38445" }),
    defineField({
      name: "supportEmail",
      title: "Support Email",
      type: "string",
      group: "contact",
      description: "Shown to shoppers, receives replies to order emails and new-order alerts",
      validation: (rule) => rule.required().email(),
    }),
    defineField({ name: "location", title: "Location", type: "string", group: "contact", description: "e.g. Hyderabad, Telangana, India" }),
    defineField({ name: "supportHours", title: "Support Hours", type: "string", group: "contact", description: "e.g. Mon–Sat, 10am–7pm IST" }),

    /* ── Footer & Social ── */
    defineField({ name: "footerAbout", title: "Footer About Text", type: "text", rows: 3, group: "footer" }),
    defineField({ name: "instagramUrl", title: "Instagram URL", type: "url", group: "footer" }),
    defineField({ name: "facebookUrl", title: "Facebook URL", type: "url", group: "footer" }),
    defineField({ name: "youtubeUrl", title: "YouTube URL", type: "url", group: "footer" }),

    /* ── Shipping & Delivery ── */
    defineField({
      name: "shippingFee",
      title: "Shipping Fee (INR ₹)",
      type: "number",
      group: "delivery",
      initialValue: 99,
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "freeShippingThreshold",
      title: "Free Shipping From (INR ₹)",
      type: "number",
      group: "delivery",
      initialValue: 2000,
      description: "Orders at or above this amount ship free. Keep it in step with the Shipping Policy page.",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "autoBookShipment",
      title: "Book the Courier Automatically After Payment",
      type: "boolean",
      group: "delivery",
      initialValue: false,
      description:
        "On: every paid order is sent to Shiprocket, a courier is chosen as set below and a pickup is requested. Off: book each order from Orders in the Studio.",
    }),
    defineField({
      name: "courierChoice",
      title: "Courier Choice for Automatic Booking",
      type: "string",
      group: "delivery",
      initialValue: "recommended",
      options: {
        list: [
          { title: "Shiprocket's recommended courier", value: "recommended" },
          { title: "Cheapest", value: "cheapest" },
          { title: "Fastest", value: "fastest" },
          { title: "Best rated", value: "rated" },
        ],
        layout: "radio",
      },
      hidden: ({ parent }) => !parent?.autoBookShipment,
    }),
  ],
  preview: {
    select: { title: "storeName", subtitle: "tagline" },
  },
});
