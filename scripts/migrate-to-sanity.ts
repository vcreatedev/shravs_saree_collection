/* One-off move of the store's content from the old Postgres database into
   Sanity: categories, products and homepage slides (with their photos), and
   the settings, announcement strip, trust badges, contact and policy pages
   that used to be written into the code.

   Run once per dataset:
     node --env-file=.env.local --import tsx scripts/migrate-to-sanity.ts production
     node --env-file=.env.local --import tsx scripts/migrate-to-sanity.ts development

   Safe to run again: every document has a fixed id and is replaced. Orders
   are not copied - the old database holds only unpaid test checkouts. */
import { createClient, type SanityClient } from "@sanity/client";
import { PrismaClient } from "@prisma/client";

const dataset = process.argv[2];
if (dataset !== "production" && dataset !== "development") {
  console.error("Usage: migrate-to-sanity.ts <production|development>");
  process.exit(1);
}
if (!process.env.SANITY_API_WRITE_TOKEN) {
  console.error("SANITY_API_WRITE_TOKEN is missing from .env.local");
  process.exit(1);
}

const sanity: SanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "l6u3st01",
  dataset,
  apiVersion: "2026-02-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});
const prisma = new PrismaClient();

const PHONE = "+91 91212 38445";
const EMAIL = "sravsbeautyandhome@gmail.com";
const UPDATED = "20 September 2026";

/* ── Photos: uploaded once each, by URL ── */

const uploaded = new Map<string, string>();

async function uploadImage(url: string | null | undefined): Promise<{ _type: "image"; asset: { _type: "reference"; _ref: string } } | null> {
  if (!url) return null;
  let assetId = uploaded.get(url);
  if (!assetId) {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ! could not download ${url} (${res.status})`);
      return null;
    }
    const filename = decodeURIComponent(url.split("/").pop() || "photo.jpg");
    const asset = await sanity.assets.upload("image", Buffer.from(await res.arrayBuffer()), { filename });
    assetId = asset._id;
    uploaded.set(url, assetId);
  }
  return { _type: "image", asset: { _type: "reference", _ref: assetId } };
}

const withKey = <T extends object>(items: T[], prefix: string) => items.map((item, i) => ({ _key: `${prefix}${i}`, ...item }));

function parseList(value: string): string[] {
  return value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];
}

function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [images];
  } catch {
    return images ? [images] : [];
  }
}

/** Writes the document, as a draft when it wasn't published before. */
async function save(doc: { _id: string; _type: string } & Record<string, unknown>, published = true) {
  const _id = published ? doc._id : `drafts.${doc._id}`;
  await sanity.createOrReplace({ ...doc, _id });
}

const BEST_SELLER_TAGS = new Set(["bestseller", "best seller", "best rated"]);

async function main() {
  console.log(`Migrating into "${dataset}"…`);

  /* Categories */
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const categoryIds = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const _id = `category-${c.slug}`;
    categoryIds.set(c.id, _id);
    await save(
      {
        _id,
        _type: "category",
        title: c.name,
        slug: { _type: "slug", current: c.slug },
        orderRank: i,
        ...(await uploadImage(c.image).then((image) => (image ? { image } : {}))),
      },
      c.published
    );
  }
  console.log(`  ${categories.length} categories`);

  /* Products */
  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  for (const [i, p] of products.entries()) {
    const tags = parseList(p.tags).map((t) => t.toLowerCase());
    const images = (await Promise.all(parseImages(p.images).map((url) => uploadImage(url)))).filter(Boolean);
    await save(
      {
        _id: `product-${p.slug}`,
        _type: "product",
        title: p.name,
        slug: { _type: "slug", current: p.slug },
        productCode: `SRV-${String(i + 1).padStart(3, "0")}`,
        category: { _type: "reference", _ref: categoryIds.get(p.categoryId) },
        description: p.description,
        price: p.price,
        ...(p.compareAtPrice ? { originalPrice: p.compareAtPrice } : {}),
        inStock: true,
        stockQuantity: p.stock,
        ...(parseList(p.colors)[0] ? { color: parseList(p.colors).join(", ") } : {}),
        images: withKey(images as object[], "img"),
        optionName: "Color",
        isNewArrival: tags.includes("new"),
        isBestSeller: tags.some((t) => BEST_SELLER_TAGS.has(t)),
        isFeatured: p.featured,
        rating: p.rating,
        reviews: p.reviewCount,
        weightKg: 0.5,
        packageCm: { length: 30, breadth: 25, height: 5 },
      },
      p.published
    );
  }
  console.log(`  ${products.length} products`);

  /* Homepage hero: one slide per photo */
  const slides = await prisma.homeHeroSlide.findMany({ orderBy: { order: "asc" } });
  let order = 1;
  for (const s of slides) {
    const images = Array.isArray(s.images) ? (s.images as string[]) : [];
    for (const url of images) {
      const image = await uploadImage(url);
      if (!image) continue;
      await save({
        _id: `hero-${order}`,
        _type: "heroBanner",
        title: s.heading,
        subtitle: s.tagline,
        description: s.description,
        ctaText: s.primaryLabel,
        ctaLink: s.primaryHref,
        ...(s.secondaryLabel && s.secondaryHref ? { secondaryCtaText: s.secondaryLabel, secondaryCtaLink: s.secondaryHref } : {}),
        ...(s.productHref ? { productLink: s.productHref } : {}),
        image,
        isActive: s.published,
        order: order,
      });
      order++;
    }
  }
  console.log(`  ${order - 1} hero slides`);

  /* Settings and shared sections. The logo was uploaded separately (the old
     database never held it), so it is kept as it is. */
  const logo = await sanity.fetch(`*[_id == "siteSettings"][0].logo`);
  await save({
    _id: "siteSettings",
    _type: "siteSettings",
    storeName: "Shravs Saree Collection",
    tagline: "Handpicked sarees, for every occasion",
    ...(logo ? { logo } : {}),
    whatsappNumber: "919121238445",
    whatsappDefaultMessage: "Hi Shravs Saree Collection! I'd like to know more about your products.",
    displayPhone: PHONE,
    supportEmail: EMAIL,
    location: "Hyderabad, Telangana, India",
    supportHours: "Mon–Sat, 10am–7pm IST",
    footerAbout: "Small-batch, thoughtfully sourced goods. Every order is packed by hand and shipped with care.",
    shippingFee: 99,
    freeShippingThreshold: 2000,
    autoBookShipment: false,
    courierChoice: "recommended",
  });
  await save({
    _id: "marqueeSection",
    _type: "marqueeSection",
    items: ["🚚 Free shipping over ₹2,000", "✨ Handpicked, small-batch drops", "↩️ Easy 7-day returns", "🔒 Pay securely with Razorpay"],
  });
  await save({
    _id: "trustBadgesSection",
    _type: "trustBadgesSection",
    badges: withKey(
      [
        { title: "Free Shipping", subtitle: "Over ₹2,000", icon: "truck" },
        { title: "Premium Quality", subtitle: "Handpicked", icon: "award" },
        { title: "Secure Payment", subtitle: "Razorpay", icon: "shield" },
        { title: "Easy Returns", subtitle: "Within 7 days", icon: "returns" },
      ],
      "badge"
    ),
  });

  /* Contact and policy pages */
  await save({
    _id: "contactPage",
    _type: "contactPage",
    title: "Contact Us",
    intro: "The fastest way to reach Shravs Saree Collection is on WhatsApp - for order questions, sizing help, returns, or anything else.",
    whatsappButtonText: "Chat with us on WhatsApp",
    updatedDate: UPDATED,
    sections: withKey(
      [
        {
          title: "Other ways to reach us",
          content:
            "- Track an existing order from [My Orders](/orders/my).\n- Read our [Shipping](/shipping-policy) and [Refund](/refund-policy) policies for common order questions.",
        },
      ],
      "s"
    ),
  });

  for (const page of POLICY_PAGES) {
    await save({
      _id: `policy-${page.slug}`,
      _type: "policyPage",
      title: page.title,
      slug: { _type: "slug", current: page.slug },
      intro: page.intro,
      updatedDate: UPDATED,
      sections: withKey(page.sections, "s"),
    });
  }
  console.log(`  settings, sections, contact page and ${POLICY_PAGES.length} policy pages`);
  console.log(`  ${uploaded.size} photos uploaded`);
}

const WHATSAPP = `WhatsApp at ${PHONE}`;

const POLICY_PAGES: { slug: string; title: string; intro: string; sections: { title: string; content: string }[] }[] = [
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    intro: "",
    sections: [
      { title: "Where we ship", content: "We currently ship across India. If you need delivery outside India, message us on WhatsApp and we'll see what we can do." },
      {
        title: "Shipping charges",
        content: "- Free shipping on orders over ₹2,000.\n- A flat shipping fee applies to orders below that, shown at checkout before you pay.",
      },
      {
        title: "Processing time",
        content:
          "Orders are handpicked and packed within 1-2 business days of payment confirmation. During sale periods or for made-to-order pieces, packing may take a little longer - we'll let you know if that's the case.",
      },
      {
        title: "Delivery timelines",
        content:
          "Once shipped, typical delivery times are:\n\n- Metro cities: 3-5 business days.\n- Rest of India: 5-8 business days.\n\nThese are estimates from our courier partners, not guarantees - remote locations or weather/logistics disruptions can occasionally add a few days.",
      },
      {
        title: "Tracking your order",
        content:
          "We email you when your order ships, with the courier, its tracking number and a tracking link, and again when it's out for delivery and when it's delivered. You can also check its status anytime from [My Orders](/orders/my).",
      },
      {
        title: "Contact us",
        content: `Order taking longer than expected? Message us on ${WHATSAPP} with your order number and we'll look into it. You can also email us at ${EMAIL}.`,
      },
    ],
  },
  {
    slug: "refund-policy",
    title: "Refund & Cancellation Policy",
    intro: "",
    sections: [
      {
        title: "Order cancellation",
        content:
          "You can cancel an order for free any time before it ships - message us on WhatsApp with your order number and we'll cancel it and refund the full amount. Once an order has shipped, it can no longer be cancelled, but you may still be eligible to return it (see below).",
      },
      {
        title: "7-day returns",
        content:
          "We offer easy returns within 7 days of delivery. To be eligible, the item must be:\n\n- Unused, unworn, and unwashed.\n- In its original condition with all tags attached.\n- Returned in its original packaging where possible.\n\nBlouse pieces cut/stitched to order, and items marked \"final sale\" at the time of purchase, are not eligible for return.",
      },
      {
        title: "How to start a return",
        content: `Message us on ${WHATSAPP} with your order number and the reason for return. We'll confirm eligibility and arrange a pickup or share a return address, whichever is easier for your location.`,
      },
      {
        title: "Damaged or incorrect items",
        content:
          "If an item arrives damaged, defective, or different from what you ordered, let us know within 48 hours of delivery with photos - we'll arrange a free replacement or a full refund, no questions asked.",
      },
      {
        title: "Refund timeline",
        content:
          "Once we've received and inspected a returned item, refunds are processed back to your original payment method through Razorpay within 5-7 business days. Depending on your bank, it may take a few additional days to reflect in your account.",
      },
      {
        title: "Contact us",
        content: `Any questions about a return or refund - reach us on WhatsApp or email us at ${EMAIL}, Mon–Sat, 10am–7pm IST, and we'll sort it out.`,
      },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    intro:
      'Shravs Saree Collection ("we", "us", "our") respects your privacy. This page explains what information we collect when you shop with us, why we collect it, and how it\'s handled.',
    sections: [
      {
        title: "Information we collect",
        content:
          "When you browse or place an order, we collect:\n\n- Contact details you give us at checkout - name, email, phone number, and shipping address.\n- Order details - items purchased, price paid, and order status.\n- Basic usage information (like pages visited) that helps us keep the site fast and working correctly.\n\nWe do not collect or store your card, UPI, or net-banking details. Payments are handled entirely by Razorpay, our payment gateway partner - see below.",
      },
      {
        title: "How we use your information",
        content:
          "- To process and deliver your order, and to keep you updated on its status.\n- To respond to questions you send us, including over WhatsApp.\n- To send your order invoice and delivery updates by email.\n- To improve the site and prevent fraud or abuse.\n\nWe do not sell your personal information to anyone.",
      },
      {
        title: "Payments via Razorpay",
        content:
          "All payments on this site are processed by [Razorpay](https://razorpay.com), a PCI-DSS compliant payment gateway. When you pay, your card/UPI/bank details go directly to Razorpay over an encrypted connection - they never pass through or get stored on our servers. Razorpay's own [privacy policy](https://razorpay.com/privacy/) governs how they handle that information.",
      },
      {
        title: "Sharing with service providers",
        content:
          "We share only what's necessary with the providers who help us run this store:\n\n- Razorpay - to process your payment.\n- Shiprocket and its courier partners - your name, address, and phone number, to deliver your order.\n- Our email provider - to send order confirmations, invoices and delivery updates.\n- Sanity - where our catalogue and your order details are stored securely.\n\nWe don't share your information with anyone else for marketing purposes.",
      },
      {
        title: "Data security",
        content:
          "We use industry-standard measures (encrypted connections, access-controlled systems) to protect the information we hold. No online system is 100% risk-free, but we take reasonable steps to keep your data safe.",
      },
      {
        title: "Your choices",
        content: "You can ask us to review, correct, or delete the personal information we hold about you by contacting us on WhatsApp or through our [Contact page](/contact-us).",
      },
      {
        title: "Changes to this policy",
        content: "We may update this policy from time to time as the site or our practices change. The date at the top of this page shows when it was last revised.",
      },
      {
        title: "Contact us",
        content: `Questions about this policy? Reach us on ${WHATSAPP}, Mon–Sat, 10am–7pm IST, or email us at ${EMAIL}.`,
      },
    ],
  },
  {
    slug: "terms-and-conditions",
    title: "Terms & Conditions",
    intro: "These terms govern your use of Shravs Saree Collection and any purchase you make with us. By placing an order, you agree to them.",
    sections: [
      {
        title: "About us",
        content: "Shravs Saree Collection is a boutique selling handpicked sarees, gowns, and related pieces online. Every order is packed by hand and shipped with care.",
      },
      {
        title: "Products, pricing & availability",
        content:
          "- We describe and photograph products as accurately as we can; minor color variation from screen to screen is possible.\n- Prices are listed in Indian Rupees (₹) and include applicable taxes unless stated otherwise.\n- We reserve the right to correct pricing errors and to limit quantities on any item.\n- Stock is confirmed only once your order is placed and payment is successful - listing a product doesn't guarantee availability.",
      },
      {
        title: "Orders & payment",
        content:
          "Placing an order is an offer to buy; we accept it once payment is confirmed. All payments are processed securely through Razorpay - we accept major cards, UPI, net banking, and wallets supported by Razorpay. We do not store your payment details.",
      },
      {
        title: "Shipping, returns & refunds",
        content: "See our [Shipping Policy](/shipping-policy) and [Refund & Cancellation Policy](/refund-policy) for full details on delivery timelines, returns, and refunds.",
      },
      {
        title: "Intellectual property",
        content: "All text, photography, and design on this site belong to Shravs Saree Collection unless otherwise noted, and may not be reused without our permission.",
      },
      {
        title: "Limitation of liability",
        content:
          "We aren't liable for indirect or consequential losses arising from your use of this site or your purchase, beyond the value of the order itself, except where such limitation isn't permitted by law.",
      },
      {
        title: "Governing law",
        content: "These terms are governed by the laws of India, and disputes are subject to the jurisdiction of the courts where Shravs Saree Collection is registered.",
      },
      {
        title: "Changes to these terms",
        content: "We may update these terms occasionally. Continued use of the site after a change means you accept the updated terms.",
      },
      {
        title: "Contact us",
        content: `Questions about these terms? Reach us on ${WHATSAPP}, Mon–Sat, 10am–7pm IST, or email us at ${EMAIL}.`,
      },
    ],
  },
];

main()
  .catch((error) => {
    console.error("Migration failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
