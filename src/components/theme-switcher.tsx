"use client";

import { useState, useSyncExternalStore } from "react";
import { Palette, X } from "lucide-react";

const STORAGE_KEY = "shravs-theme";

const THEMES = [
  { id: "heritage", name: "Heritage", swatch: ["#ff4b1f", "#b8862e", "#1f5a45"] },
  { id: "wine", name: "Wine & Gold", swatch: ["#7a1f3d", "#c8a24a", "#2e4a3a"] },
  { id: "emerald", name: "Emerald & Gold", swatch: ["#14532d", "#bd9b4f", "#1f5a45"] },
  { id: "blush", name: "Rose & Gold", swatch: ["#b76e79", "#d4a373", "#7d4f5c"] },
  { id: "terracotta", name: "Terracotta & Bronze", swatch: ["#c1440e", "#b8783a", "#4a3728"] },
  { id: "charcoal", name: "Charcoal & Champagne", swatch: ["#8a6d3f", "#cbab55", "#171614"] },
  { id: "midnight", name: "Midnight Wine", swatch: ["#e0536f", "#e0b563", "#1c1214"] },
  { id: "onyx", name: "Onyx & Gold", swatch: ["#e8b64a", "#4a5a4a", "#14120f"] },
] as const;

const emptySubscribe = () => () => {};

function readSavedTheme(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && THEMES.some((t) => t.id === saved) ? saved : "heritage";
  } catch {
    return "heritage";
  }
}

function applyTheme(id: string) {
  if (id === "heritage") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", id);
  }
}

/** Floating theme picker - swaps the CSS custom properties every color
 * utility in the app reads from (see globals.css), so switching here
 * re-colors the whole application, not just this page. The choice is a
 * per-browser preference (localStorage), not saved anywhere server-side. */
export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  // Reads localStorage directly instead of an effect + setState (which
  // would read the pre-hydration value on the server, then desync) -
  // useSyncExternalStore re-reads it on every render this component takes,
  // which is enough since selectTheme below always triggers one.
  const theme = useSyncExternalStore(emptySubscribe, readSavedTheme, () => "heritage");

  function selectTheme(id: string) {
    setOpen(false);
    applyTheme(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Private browsing / storage disabled - the pick still applies for
      // this page view, it just won't persist across visits.
    }
  }

  return (
    <div className="fixed bottom-5 left-5 z-40">
      {open && (
        <div className="absolute bottom-16 left-0 w-60 rounded-2xl border hairline bg-paper p-3 shadow-xl">
          <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Choose a theme
          </p>
          <div className="space-y-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTheme(t.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-ink/5 ${
                  theme === t.id ? "bg-ink/5 font-semibold" : ""
                }`}
              >
                <span className="flex -space-x-1.5">
                  {t.swatch.map((c) => (
                    <span
                      key={c}
                      className="h-4 w-4 rounded-full border-2 border-paper"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change color theme"
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-cream shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
      </button>
    </div>
  );
}
