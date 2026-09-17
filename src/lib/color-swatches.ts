const COLOR_SWATCHES: Record<string, string> = {
  black: "#17140f",
  white: "#ffffff",
  red: "#dc2626",
  maroon: "#7f1d1d",
  wine: "#722f37",
  purple: "#7e22ce",
  violet: "#5b21b6",
  pink: "#ec4899",
  gold: "#b8862e",
  green: "#16a34a",
  blue: "#2563eb",
  navy: "#1e3a5f",
  beige: "#e8dcc8",
  cream: "#f5f0e1",
  yellow: "#eab308",
  orange: "#ea580c",
  grey: "#9ca3af",
  gray: "#9ca3af",
  silver: "#c0c0c0",
  charcoal: "#36454f",
  olive: "#6b7d3d",
  teal: "#0f766e",
  indigo: "#4338ca",
  rust: "#b7410e",
  mustard: "#d4a017",
  coral: "#ff6f61",
  peach: "#ffcba4",
  mint: "#a8e6cf",
  sand: "#c2b280",
  brown: "#7b4a2f",
  tan: "#d2b48c",
};

const FALLBACK_SWATCH = "#d4d4d8";

/** Best-effort hex for a free-text color name; falls back to a neutral grey (e.g. for print/pattern names). */
export function getSwatchColor(name: string): string {
  const key = name.trim().toLowerCase();
  if (COLOR_SWATCHES[key]) return COLOR_SWATCHES[key];
  // Fall back to letting the browser try the raw name as a CSS color keyword
  // (covers names we haven't curated, like "Teal" variants); if invalid, the
  // caller's inline style will just be ignored by the browser -- acceptable,
  // but we still hand back something so the swatch isn't literally empty.
  return key.replace(/\s+/g, "") || FALLBACK_SWATCH;
}

export function isLightSwatch(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.85;
}
