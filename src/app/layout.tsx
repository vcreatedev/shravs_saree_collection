import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { STORE_EMAIL, STORE_PHONE_LINK } from "@/lib/contact";
import { getSiteSettings } from "@/lib/catalog";
import { logoShareImages, squareImage } from "@/sanity/image";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://www.sravsboutique.com";

const TITLE = "Shravs Saree Collection — Handpicked Sarees, Woven with a Story";

const SITE_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Shravs Saree Collection",
  },
  description:
    "Discover handpicked silk sarees, floral georgettes, and embroidered anarkali gowns at Shravs Saree Collection. Premium ethnic drapes curated for every celebration.",
  keywords: [
    "sarees online",
    "silk sarees",
    "printed georgette sarees",
    "anarkali gowns",
    "designer sarees India",
    "wedding sarees",
    "festive wear sarees",
    "Shravs Saree Collection",
    "Sravs Boutique",
  ],
  authors: [{ name: "Shravs Saree Collection" }],
  creator: "Shravs Saree Collection",
  publisher: "Shravs Saree Collection",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google4229f39518f79c9b",
  },
};

// The share picture and the browser and home-screen icons are the logo from
// the Studio (Storefront Settings → Brand), sized by Sanity's image CDN.
export async function generateMetadata(): Promise<Metadata> {
  const { logo } = await getSiteSettings();
  const shareImages = logoShareImages(logo, "Shravs Saree Collection");
  return {
    ...SITE_METADATA,
    openGraph: {
      title: TITLE,
      description:
        "Discover handpicked silk sarees, floral georgettes, and embroidered anarkali gowns at Shravs Saree Collection. Premium ethnic drapes curated for every celebration.",
      url: SITE_URL,
      siteName: "Shravs Saree Collection",
      locale: "en_IN",
      type: "website",
      images: shareImages,
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description:
        "Discover handpicked silk sarees, floral georgettes, and embroidered anarkali gowns at Shravs Saree Collection.",
      images: shareImages.map((image) => image.url),
    },
    icons: logo
      ? {
          icon: [
            { url: squareImage(logo, 32), sizes: "32x32", type: "image/png" },
            { url: squareImage(logo, 192), sizes: "192x192", type: "image/png" },
          ],
          apple: [{ url: squareImage(logo, 180), sizes: "180x180", type: "image/png" }],
        }
      : undefined,
  };
}

const jsonLd = (logo: string) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Shravs Saree Collection",
      url: SITE_URL,
      ...(logo ? { logo } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: "Hyderabad",
        addressRegion: "Telangana",
        addressCountry: "IN",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: STORE_PHONE_LINK.replace("tel:", ""),
        email: STORE_EMAIL,
        areaServed: "IN",
        availableLanguage: ["en", "te", "hi"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Shravs Saree Collection",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/shop?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
});

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { logo } = await getSiteSettings();
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(logo)) }}
        />
      </head>
      <body className="flex flex-col overflow-x-hidden bg-cream text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
