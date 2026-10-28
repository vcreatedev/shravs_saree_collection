"use client";

import { createContext, useContext } from "react";
import type { SiteSettings } from "@/lib/catalog";

/* Storefront Settings from the Studio - WhatsApp number, contact details,
   announcements, shipping fee - for every component on the page. The site
   layout reads them once per page and hands them down here. */
const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings {
  const settings = useContext(SiteSettingsContext);
  if (!settings) throw new Error("useSiteSettings must be used inside SiteSettingsProvider.");
  return settings;
}
