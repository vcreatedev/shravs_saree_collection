"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const DISPLAY_MS = 1800;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Full-screen logo reveal shown once on first load - the root layout
 * doesn't remount on client-side navigation, so this naturally only ever
 * shows once per real page load (fresh visit/refresh), never on internal
 * route changes, without needing sessionStorage bookkeeping. */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Respect prefers-reduced-motion by skipping the intro entirely (via the
    // early return below) rather than forcing a scale/fade sequence on
    // someone who's opted out of motion - nothing to schedule here in that
    // case.
    if (reduceMotion) return;
    const timeout = setTimeout(() => setVisible(false), DISPLAY_MS);
    return () => clearTimeout(timeout);
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-band"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8, skewY: 6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0, skewY: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 11, mass: 0.7 }}
            style={{ transformOrigin: "top center" }}
            className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-gold/60 sm:h-36 sm:w-36"
          >
            <Image src="/logo.jpg" alt="" fill sizes="144px" className="object-cover" priority />
          </motion.div>

          <div className="h-px w-40 overflow-hidden rounded-full bg-band-fg/15 sm:w-48">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: DISPLAY_MS / 1000, ease: "linear" }}
              className="h-full bg-gold"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
