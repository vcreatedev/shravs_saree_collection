import { buildLegacyTheme, type StudioTheme } from "sanity";

/* The Studio in the shop's colours (the --raw-* palette in globals.css):
   ivory panes with espresso text, burgundy buttons, links and focus rings,
   and a wine top bar with ivory text, like the site's header. Inter for text
   and Playfair Display for headings, which the root layout already loads.

   buildLegacyTheme is used rather than @sanity/themer's buildTheme because
   the themer needs React 19.3 (this site runs 19.2), and it ignores custom
   fonts. A legacy theme keeps the Studio in this one light scheme. */
const theme = buildLegacyTheme({
  "--font-family-base": "var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  "--black": "#1f110a",
  "--white": "#fff8ec",
  "--component-bg": "#fff8ec",
  "--component-text-color": "#432516",
  "--gray": "#947044",
  "--gray-base": "#947044",

  "--brand-primary": "#8b1645",
  "--focus-color": "#8b1645",

  "--default-button-color": "#947044",
  "--default-button-primary-color": "#8b1645",
  "--default-button-success-color": "#15803d",
  "--default-button-warning-color": "#c99a3b",
  "--default-button-danger-color": "#c0392b",

  "--state-info-color": "#8b1645",
  "--state-success-color": "#15803d",
  "--state-warning-color": "#c99a3b",
  "--state-danger-color": "#c0392b",

  "--main-navigation-color": "#64132f",
  "--main-navigation-color--inverted": "#fff8ec",
});

export const studioTheme: StudioTheme = {
  ...theme,
  fonts: theme.fonts && {
    ...theme.fonts,
    heading: { ...theme.fonts.heading, family: "var(--font-playfair), Georgia, serif" },
  },
};
