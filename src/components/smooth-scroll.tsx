"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { setSmoothScroller } from "@/lib/smooth-scroll";

/** Lenis momentum scrolling for mouse wheels and trackpads. Touch screens
 * keep their own native scrolling, and it stays off for anyone who has asked
 * their system to reduce motion. Turns itself on and off as either changes
 * (a tablet docking a mouse, a setting flipped). */
export function SmoothScroll() {
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    function update() {
      const wanted = finePointer.matches && !reducedMotion.matches;
      if (wanted && !lenis) {
        lenis = new Lenis({ autoRaf: true, anchors: true });
        setSmoothScroller(lenis);
        // An overlay may already be holding the page still.
        if (document.documentElement.style.overflow === "hidden") lenis.stop();
      } else if (!wanted && lenis) {
        lenis.destroy();
        lenis = null;
        setSmoothScroller(null);
      }
    }

    update();
    finePointer.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      finePointer.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
      lenis?.destroy();
      setSmoothScroller(null);
    };
  }, []);

  return null;
}
