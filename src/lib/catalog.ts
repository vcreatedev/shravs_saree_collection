import { client } from "@/sanity/client";
import { dataset } from "@/sanity/env";
import { STORE_EMAIL, STORE_LOCATION, STORE_PHONE, WHATSAPP_NUMBER } from "./contact";
import type { Category, Product, ProductFilters, ProductSort } from "@/types";

/* The storefront's products, collections and page content, all read from
   Sanity (published versions only).

   The live site keeps what it fetched until something is published: Sanity's
   webhook calls /api/revalidate, which marks this tag outdated, and each page
   fetches fresh content on its next visit. Local development, which the
   webhook can't reach, refreshes at most once a minute. */
export const CONTENT_TAG = "sanity";

const CACHE =
  dataset === "production"
    ? { next: { revalidate: false as const, tags: [CONTENT_TAG] } }
    : { next: { revalidate: 60, tags: [CONTENT_TAG] } };

function fetchContent<T>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  return client.fetch<T>(query, params, CACHE);
}

/* ── Products ── */

const PRODUCT_PROJECTION = `{
  "id": _id,
  "slug": slug.current,
  "name": title,
  "code": coalesce(productCode, ""),
  "description": coalesce(description, ""),
  price,
  "compareAtPrice": originalPrice,
  "images": images[].asset->url,
  "hoverImage": hoverImage.asset->url,
  color,
  "optionName": coalesce(optionName, "Color"),
  "variants": variants[defined(image)]{ "key": _key, name, "image": image.asset->url, "inStock": coalesce(inStock, true) },
  "sizes": sizes[]{ "key": _key, size, "stock": coalesce(stockQuantity, 0) },
  "available": coalesce(inStock, true),
  "stockQuantity": coalesce(stockQuantity, 0),
  "rating": coalesce(rating, 0),
  "reviewCount": coalesce(reviews, 0),
  "isNew": coalesce(isNewArrival, false),
  "isBestSeller": coalesce(isBestSeller, false),
  "isFeatured": coalesce(isFeatured, false),
  fabric, craft, blousePiece, length, washCare, occasion,
  metaTitle, metaDescription,
  "category": category->{ "id": _id, "name": title, "slug": slug.current, "image": image.asset->url },
  "createdAt": _createdAt
}`;

type RawProduct = Omit<Product, "stock" | "details" | "variants" | "sizes" | "images" | "category"> & {
  images: string[] | null;
  variants: Product["variants"] | null;
  sizes: Product["sizes"] | null;
  available: boolean;
  stockQuantity: number;
  category: Category | null;
  fabric?: string | null;
  craft?: string | null;
  blousePiece?: string | null;
  length?: string | null;
  washCare?: string | null;
  occasion?: string | null;
};

const DETAIL_LABELS = [
  ["fabric", "Fabric"],
  ["craft", "Work"],
  ["color", "Colour"],
  ["blousePiece", "Blouse piece"],
  ["length", "Length"],
  ["occasion", "Occasion"],
  ["washCare", "Care"],
] as const;

const NO_CATEGORY: Category = { id: "", name: "", slug: "", image: null };

function toProduct(raw: RawProduct): Product {
  const sizes = (raw.sizes ?? []).filter((s) => s.size);
  const pieces = sizes.length > 0 ? sizes.reduce((sum, s) => sum + Math.max(0, s.stock), 0) : raw.stockQuantity;
  return {
    ...raw,
    images: (raw.images ?? []).filter(Boolean),
    variants: raw.variants ?? [],
    sizes: sizes.map((s) => ({ ...s, stock: Math.max(0, s.stock) })),
    stock: raw.available ? Math.max(0, pieces) : 0,
    details: DETAIL_LABELS.flatMap(([key, label]) => {
      const value = raw[key];
      return value ? [{ label, value }] : [];
    }),
    category: raw.category ?? NO_CATEGORY,
  };
}

async function fetchProducts(query: string, params: Record<string, unknown> = {}): Promise<Product[]> {
  const raw = await fetchContent<RawProduct[]>(query, params);
  return raw.map(toProduct);
}

/** How each collections sort orders the catalog. "featured" puts the products
 * marked Featured first, and "rating" (Best Sellers) the ones marked Best
 * Seller, each then newest or best rated first. */
const ORDER: Record<ProductSort, string> = {
  featured: "isFeatured desc, _createdAt desc",
  "price-asc": "price asc",
  "price-desc": "price desc",
  newest: "_createdAt desc",
  "name-asc": "lower(title) asc",
  "name-desc": "lower(title) desc",
  rating: "isBestSeller desc, rating desc, _createdAt desc",
};

export async function getProducts(filters: ProductFilters): Promise<Product[]> {
  const conditions = ['_type == "product"', "defined(slug.current)"];
  const params: Record<string, unknown> = {};

  // Every word of the search has to appear somewhere - title, description,
  // code, colour, fabric or category - in any order, matching word starts
  // (so "sare" finds "saree").
  const words = (filters.q ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 8);
  words.forEach((word, i) => {
    params[`w${i}`] = `${word.replace(/[*"\\]/g, "")}*`;
    conditions.push(
      `(title match $w${i} || description match $w${i} || productCode match $w${i} || color match $w${i} || fabric match $w${i} || category->title match $w${i})`
    );
  });

  if (filters.category) {
    conditions.push("category->slug.current == $category");
    params.category = filters.category;
  }

  const sort = filters.sort && filters.sort in ORDER ? filters.sort : "newest";
  // The New Arrivals view lists the products marked New first, without hiding the rest.
  const order = filters.tag?.toLowerCase() === "new" ? `isNewArrival desc, ${ORDER[sort]}` : ORDER[sort];

  return fetchProducts(`*[${conditions.join(" && ")}] | order(${order}) ${PRODUCT_PROJECTION}`, params);
}

export function getProductBySlug(slug: string): Promise<Product | null> {
  return fetchContent<RawProduct | null>(`*[_type == "product" && slug.current == $slug][0] ${PRODUCT_PROJECTION}`, {
    slug,
  }).then((raw) => (raw ? toProduct(raw) : null));
}

export function getAllProductSlugs(): Promise<string[]> {
  return fetchContent<string[]>(`*[_type == "product" && defined(slug.current)].slug.current`);
}

/** Up to 8 products tagged New for the homepage, newest first. */
export function getNewArrivals(): Promise<Product[]> {
  return fetchProducts(
    `*[_type == "product" && defined(slug.current) && isNewArrival == true] | order(_createdAt desc) [0...8] ${PRODUCT_PROJECTION}`
  );
}

/** Up to 8 products for the homepage's Best Sellers: those marked Best
 * Seller first, then the best rated. */
export function getBestRatedProducts(): Promise<Product[]> {
  return fetchProducts(
    `*[_type == "product" && defined(slug.current)] | order(isBestSeller desc, rating desc, _createdAt desc) [0...8] ${PRODUCT_PROJECTION}`
  );
}

const RELATED_LIMIT = 8;

/** "Similar products" for a product page: up to 8 others, newest first from
 * its own category, then topped up with the newest from the rest of the
 * catalog so a small category still fills the row. */
export function getRelatedProducts(categoryId: string, excludeId: string): Promise<Product[]> {
  return fetchProducts(
    `*[_type == "product" && defined(slug.current) && _id != $excludeId]
      | order(select(category._ref == $categoryId => 0, 1) asc, _createdAt desc) [0...${RELATED_LIMIT}] ${PRODUCT_PROJECTION}`,
    { categoryId, excludeId }
  );
}

/* ── Collections ── */

export function getCategories(): Promise<Category[]> {
  return fetchContent<Category[]>(
    `*[_type == "category" && defined(slug.current)] | order(coalesce(orderRank, 0) asc, lower(title) asc) {
      "id": _id, "name": title, "slug": slug.current, "image": image.asset->url, "description": coalesce(description, "")
    }`
  );
}

/* ── Homepage ── */

export type HeroSlide = {
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
  /** A taller crop shown on phones instead, when the slide has one. */
  mobileImage: string;
};

/** The homepage hero's slides, each one photo, in slide order. */
export function getHeroSlides(): Promise<HeroSlide[]> {
  return fetchContent<HeroSlide[]>(
    `*[_type == "heroBanner" && isActive != false && defined(image.asset)] | order(coalesce(order, 0) asc, _createdAt asc) {
      "id": _id,
      "tagline": coalesce(subtitle, ""),
      "heading": coalesce(title, ""),
      "description": coalesce(description, ""),
      "primaryLabel": coalesce(ctaText, "Shop the collection"),
      "primaryHref": coalesce(ctaLink, "/shop"),
      "secondaryLabel": coalesce(secondaryCtaText, ""),
      "secondaryHref": coalesce(secondaryCtaLink, ""),
      "productHref": coalesce(productLink, ""),
      "images": [image.asset->url],
      "mobileImage": coalesce(mobileImage.asset->url, "")
    }`
  );
}

/* ── Site settings and shared sections ── */

export type TrustBadge = { title: string; subtitle: string; icon: string };

export type SiteSettings = {
  storeName: string;
  tagline: string;
  /** The logo's Sanity image address, "" until one is uploaded. */
  logo: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  displayPhone: string;
  phoneLink: string;
  supportEmail: string;
  location: string;
  supportHours: string;
  footerAbout: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  shippingFee: number;
  freeShippingThreshold: number;
  autoBookShipment: boolean;
  courierChoice: "recommended" | "cheapest" | "fastest" | "rated";
  announcements: string[];
  trustBadges: TrustBadge[];
};

/** Used when a setting hasn't been filled in in the Studio yet. */
const DEFAULT_SETTINGS: SiteSettings = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection",
  tagline: "Handpicked sarees, for every occasion",
  logo: "",
  whatsappNumber: WHATSAPP_NUMBER,
  whatsappDefaultMessage: "",
  displayPhone: STORE_PHONE,
  phoneLink: "",
  supportEmail: STORE_EMAIL,
  location: STORE_LOCATION,
  supportHours: "Mon–Sat, 10am–7pm IST",
  footerAbout: "Small-batch, thoughtfully sourced goods. Every order is packed by hand and shipped with care.",
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  shippingFee: 99,
  freeShippingThreshold: 2000,
  autoBookShipment: false,
  courierChoice: "recommended",
  announcements: [],
  trustBadges: [],
};

type RawSettings = Partial<Record<keyof SiteSettings, unknown>>;

export async function getSiteSettings(): Promise<SiteSettings> {
  const raw = await fetchContent<RawSettings | null>(
    `{
      ...*[_id == "siteSettings"][0]{
        storeName, tagline, "logo": logo.asset->url, whatsappNumber, whatsappDefaultMessage, displayPhone, supportEmail,
        location, supportHours, footerAbout, instagramUrl, facebookUrl, youtubeUrl,
        shippingFee, freeShippingThreshold, autoBookShipment, courierChoice
      },
      "announcements": *[_id == "marqueeSection"][0].items,
      "trustBadges": *[_id == "trustBadgesSection"][0].badges[]{ "title": coalesce(title, ""), "subtitle": coalesce(subtitle, ""), "icon": coalesce(icon, "sparkles") }
    }`
  );
  const settings = { ...DEFAULT_SETTINGS };
  for (const [key, value] of Object.entries(raw ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      (settings as Record<string, unknown>)[key] = value;
    }
  }
  const phoneDigits = settings.displayPhone.replace(/[^\d+]/g, "");
  settings.phoneLink = phoneDigits ? `tel:${phoneDigits}` : "";
  return settings;
}

/* ── Pages ── */

export type PageSection = { title: string; content: string };

export type PolicyPageContent = {
  title: string;
  intro: string;
  updatedDate: string;
  sections: PageSection[];
};

export function getPolicyPage(slug: string): Promise<PolicyPageContent | null> {
  return fetchContent<PolicyPageContent | null>(
    `*[_type == "policyPage" && slug.current == $slug][0]{
      title, "intro": coalesce(intro, ""), "updatedDate": coalesce(updatedDate, ""),
      "sections": coalesce(sections[]{ "title": coalesce(title, ""), "content": coalesce(content, "") }, [])
    }`,
    { slug }
  );
}

export type ContactPageContent = PolicyPageContent & { whatsappButtonText: string; mapsUrl: string };

export function getContactPage(): Promise<ContactPageContent | null> {
  return fetchContent<ContactPageContent | null>(
    `*[_id == "contactPage"][0]{
      title, "intro": coalesce(intro, ""), "updatedDate": coalesce(updatedDate, ""),
      "whatsappButtonText": coalesce(whatsappButtonText, "Chat with us on WhatsApp"),
      "mapsUrl": coalesce(mapsUrl, ""),
      "sections": coalesce(sections[]{ "title": coalesce(title, ""), "content": coalesce(content, "") }, [])
    }`
  );
}
