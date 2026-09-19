import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeSwitcher } from "@/components/theme-switcher";

// Applies a saved theme choice before first paint, so the page doesn't
// flash the default palette and then jump to the saved one.
const SET_THEME_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("shravs-theme");
    if (t && t !== "heritage") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
`;

const fraunces = Fraunces({
  variable: "--font-fraunces",
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
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full`}
      // The theme script below sets data-theme on this element before React
      // hydrates, based on a saved preference the server can't know about -
      // that's an intentional, expected mismatch, not a bug to warn about.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SET_THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden bg-cream text-ink antialiased">
        <Providers>{children}</Providers>
        <ThemeSwitcher />
      </body>
    </html>
  );
}
