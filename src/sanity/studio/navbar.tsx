"use client";

import { ThemeColorProvider } from "@sanity/ui";
import type { NavbarProps } from "sanity";

/* The Studio's top bar in the wine of the site's header. The theme's dark
   scheme holds the header colours (theme.ts, --main-navigation-color). */
export function ShopNavbar(props: NavbarProps) {
  return <ThemeColorProvider scheme="dark">{props.renderDefault(props)}</ThemeColorProvider>;
}
