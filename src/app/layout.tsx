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

export const metadata: Metadata = {
  title: {
    default: "Shravs Saree Collection — Handpicked sarees, for every occasion",
    template: "%s · Shravs Saree Collection",
  },
  description:
    "Shravs Saree Collection is a boutique for handpicked, well-made sarees and accessories.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable} h-full`}>
      <body className="flex flex-col overflow-x-hidden bg-cream text-ink antialiased">
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
