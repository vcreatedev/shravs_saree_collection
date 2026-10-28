"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSiteSettings } from "@/components/site-settings";

const DISPLAY_MS = 1800;
const EXIT_MS = 600;

/** Full-screen logo reveal shown once on first load - the root layout
 * doesn't remount on client-side navigation, so this naturally only ever
 * shows once per real page load (fresh visit/refresh), never on internal
 * route changes, without needing sessionStorage bookkeeping.
 *
 * All of its motion is CSS (.splash-logo / .splash-bar keyframes and the
 * exit fade), which the browser runs on its compositor thread - it plays
 * smoothly during page load, exactly when the main thread is busiest, and
 * since it's server-rendered it starts on first paint, before JavaScript has
 * even loaded. Hidden entirely for prefers-reduced-motion (globals.css). */
export function SplashScreen() {
  const { logo } = useSiteSettings();
  const [phase, setPhase] = useState<"showing" | "leaving" | "gone">("showing");

  useEffect(() => {
    const leave = setTimeout(() => setPhase("leaving"), DISPLAY_MS);
    const gone = setTimeout(() => setPhase("gone"), DISPLAY_MS + EXIT_MS);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`splash fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-band transition-opacity duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="splash-logo relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-gold/60 sm:h-36 sm:w-36">
        {logo && <Image src={logo} alt="" fill sizes="144px" className="object-cover" preload />}
      </div>

      <div className="h-px w-40 overflow-hidden rounded-full bg-band-fg/15 sm:w-48">
        <div className="splash-bar h-full bg-gold" />
      </div>
    </div>
  );
}
