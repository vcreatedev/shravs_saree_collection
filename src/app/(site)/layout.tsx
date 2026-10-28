import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { CartDrawer } from "@/components/cart-drawer";
import { BottomNav } from "@/components/bottom-nav";
import { SiteSettingsProvider } from "@/components/site-settings";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SplashScreen } from "@/components/splash-screen";
import { getSiteSettings } from "@/lib/catalog";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <SiteSettingsProvider settings={settings}>
      <SplashScreen />
      <SmoothScroll />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
      <WhatsAppButton />
      <BottomNav />
      <CartDrawer />
    </SiteSettingsProvider>
  );
}
