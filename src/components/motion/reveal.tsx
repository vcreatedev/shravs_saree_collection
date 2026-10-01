"use client";

import { useEffect, useRef } from "react";

// Starts the reveal as the content crosses into the bottom of the screen, so
// it has already begun gliding by the time it's in full view.
const ROOT_MARGIN = "0px 0px -8% 0px";

/** Marks the element as revealed (data-revealed) the first time it scrolls
 * into view - the glide itself is a CSS transition (.reveal / .reveal-item in
 * globals.css). The browser runs opacity/transform transitions on its
 * compositor thread, so once started they stay smooth however busy the main
 * thread gets, and scrolling can't slow them down. Only this one-off trigger
 * touches JavaScript. */
function useRevealOnView(stagger?: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (stagger !== undefined) {
          Array.from(el.children).forEach((child, i) => {
            (child as HTMLElement).style.transitionDelay = `${i * stagger}s`;
          });
        }
        el.dataset.revealed = "";
        observer.disconnect();
      },
      { rootMargin: ROOT_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stagger]);
  return ref;
}

/** Glides a section's content into place the first time it scrolls into
 * view - the default per-section entrance used across the site. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRevealOnView();
  return (
    <div
      ref={ref}
      className={className ? `reveal ${className}` : "reveal"}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

/** Wraps a grid of cards (product tiles, category tiles, price bands) so
 * they glide in one after another instead of all at once - pair with
 * StaggerItem on each direct child. */
export function StaggerGroup({
  children,
  className,
  stagger = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRevealOnView(stagger);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ? `reveal-item ${className}` : "reveal-item"}>{children}</div>;
}
