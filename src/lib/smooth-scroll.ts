import type Lenis from "lenis";

/* The page's Lenis smooth scroller while one is running (mouse and trackpad
   only, see components/smooth-scroll.tsx) - shared so a scroll lock can
   pause it. */
let current: Lenis | null = null;

export function setSmoothScroller(lenis: Lenis | null) {
  current = lenis;
}

export function getSmoothScroller(): Lenis | null {
  return current;
}
