import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SplashScreen } from "@/components/splash-screen";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shravs Saree Collection — Handpicked Sarees, Woven with a Story",
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
  openGraph: {
    title: "Shravs Saree Collection — Handpicked Sarees, Woven with a Story",
    description:
      "Discover handpicked silk sarees, floral georgettes, and embroidered anarkali gowns at Shravs Saree Collection. Premium ethnic drapes curated for every celebration.",
    url: SITE_URL,
    siteName: "Shravs Saree Collection",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/logo.jpg",
        width: 800,
        height: 800,
        alt: "Shravs Saree Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shravs Saree Collection — Handpicked Sarees, Woven with a Story",
    description:
      "Discover handpicked silk sarees, floral georgettes, and embroidered anarkali gowns at Shravs Saree Collection.",
    images: ["/logo.jpg"],
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
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Shravs Saree Collection",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.jpg`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="flex flex-col overflow-x-hidden bg-cream text-ink antialiased">
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
