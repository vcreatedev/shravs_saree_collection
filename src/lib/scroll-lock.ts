import { getSmoothScroller } from "./smooth-scroll";

/** Locks or unlocks page scrolling while an overlay (cart drawer, filter
 * sheet) is open. Set on <html>, not <body>: html carries overflow-x: clip
 * (globals.css), which stops body's overflow from being passed up to the page,
 * so hiding body's overflow no longer locks anything. The smooth scroller is
 * paused too, or it would keep scrolling the page under the overlay. */
export function setPageScrollLocked(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  const lenis = getSmoothScroller();
  if (locked) lenis?.stop();
  else lenis?.start();
}
