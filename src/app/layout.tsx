import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SplashScreen } from "@/components/splash-screen";

// Applies a saved theme choice before first paint, so the page doesn't
// flash the default palette and then jump to the saved one.
const SET_THEME_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("shravs-theme");
    if (t && t !== "sravs") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
`;

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
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
      className={`${playfairDisplay.variable} ${outfit.variable} h-full`}
      // The theme script below sets data-theme on this element before React
      // hydrates, based on a saved preference the server can't know about -
      // that's an intentional, expected mismatch, not a bug to warn about.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SET_THEME_SCRIPT }} />
      </head>
      <body className="flex flex-col overflow-x-hidden bg-cream text-ink antialiased">
        <SplashScreen />
        <Providers>{children}</Providers>
        <ThemeSwitcher />
      </body>
    </html>
  );
}
