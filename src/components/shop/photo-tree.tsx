"use client";

import Image from "next/image";
import { Sparkle } from "lucide-react";
import { useEffect } from "react";

// How long the row stays on screen before a multi-slide carousel moves on -
// every photo is visible at once here (no per-image cycling), so this stands
// in for HeroSlideshow's "every image has had its turn" timing.
const DISPLAY_MS = 6000;

type Slot = { leftPct: number; sizeClass: string };

// Hand-placed layouts per photo count - a single evenly-spaced row (the wave
// animation supplies the vertical motion, so the resting layout stays flat),
// shrinking a little as more photos need to share the row. leftPct is a
// percent of the row's width, so this holds up at any size.
const LAYOUTS: Record<number, Slot[]> = {
  1: [{ leftPct: 50, sizeClass: "h-40 w-40 sm:h-44 sm:w-44 lg:h-52 lg:w-52" }],
  2: [
    { leftPct: 22, sizeClass: "h-36 w-36 sm:h-40 sm:w-40 lg:h-48 lg:w-48" },
    { leftPct: 78, sizeClass: "h-36 w-36 sm:h-40 sm:w-40 lg:h-48 lg:w-48" },
  ],
  3: [
    { leftPct: 10, sizeClass: "h-32 w-32 sm:h-36 sm:w-36 lg:h-44 lg:w-44" },
    { leftPct: 50, sizeClass: "h-32 w-32 sm:h-36 sm:w-36 lg:h-44 lg:w-44" },
    { leftPct: 90, sizeClass: "h-32 w-32 sm:h-36 sm:w-36 lg:h-44 lg:w-44" },
  ],
  4: [
    { leftPct: 4, sizeClass: "h-28 w-28 sm:h-32 sm:w-32 lg:h-40 lg:w-40" },
    { leftPct: 36, sizeClass: "h-28 w-28 sm:h-32 sm:w-32 lg:h-40 lg:w-40" },
    { leftPct: 64, sizeClass: "h-28 w-28 sm:h-32 sm:w-32 lg:h-40 lg:w-40" },
    { leftPct: 96, sizeClass: "h-28 w-28 sm:h-32 sm:w-32 lg:h-40 lg:w-40" },
  ],
  5: [
    { leftPct: 2, sizeClass: "h-24 w-24 sm:h-28 sm:w-28 lg:h-36 lg:w-36" },
    { leftPct: 26, sizeClass: "h-24 w-24 sm:h-28 sm:w-28 lg:h-36 lg:w-36" },
    { leftPct: 50, sizeClass: "h-24 w-24 sm:h-28 sm:w-28 lg:h-36 lg:w-36" },
    { leftPct: 74, sizeClass: "h-24 w-24 sm:h-28 sm:w-28 lg:h-36 lg:w-36" },
    { leftPct: 98, sizeClass: "h-24 w-24 sm:h-28 sm:w-28 lg:h-36 lg:w-36" },
  ],
  6: [
    { leftPct: 0, sizeClass: "h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32" },
    { leftPct: 20, sizeClass: "h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32" },
    { leftPct: 40, sizeClass: "h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32" },
    { leftPct: 60, sizeClass: "h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32" },
    { leftPct: 80, sizeClass: "h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32" },
    { leftPct: 100, sizeClass: "h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32" },
  ],
};

const MAX_PHOTOS = 6;

/** Decorative sparkles for the whole slide - rendered separately so they can
 * sit behind everything (text and photos included). Transparent: the glossy
 * background itself is on the hero carousel's outer wrapper, so it also runs
 * unbroken behind the section dots below the slides. */
export function PhotoTreeBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Hidden on short screens (phones held sideways), where the hero's
          text starts high enough that this one would sit on the tagline. */}
      <Sparkle
        className="absolute left-[6%] top-[10%] h-6 w-6 text-gold/70 [@media(max-height:520px)]:hidden"
        fill="currentColor"
      />
      <Sparkle className="absolute right-[8%] top-[16%] h-4 w-4 text-gold/50" fill="currentColor" />
      <Sparkle className="absolute right-[4%] top-[6%] h-7 w-7 text-gold/60" fill="currentColor" />
    </div>
  );
}

export function PhotoTree({
  images,
  alt,
  active = true,
  onAllShown,
}: {
  images: string[];
  alt: string;
  /** Whether this row is the one currently on screen - matches HeroSlideshow's
   * prop so this can drop straight into the same carousel slot. */
  active?: boolean;
  /** Fires after the row has had its time on screen - lets a parent carousel
   * move on to the next section. */
  onAllShown?: () => void;
}) {
  useEffect(() => {
    if (!active) return;
    const timeout = setTimeout(() => onAllShown?.(), DISPLAY_MS);
    return () => clearTimeout(timeout);
  }, [active, onAllShown]);

  const photos = images.slice(0, MAX_PHOTOS);
  if (photos.length === 0) return null;

  const layout = LAYOUTS[photos.length];

  return (
    <div className="relative mx-auto h-64 w-full max-w-4xl sm:h-72 lg:h-96">
      {photos.map((src, i) => {
        const spot = layout[i];
        return (
          <div
            key={src + i}
            className={`animate-photo-wave absolute top-1/2 overflow-hidden rounded-full border-4 border-paper shadow-md ${spot.sizeClass}`}
            style={{
              left: `${spot.leftPct}%`,
              // Same duration for every circle, started at a staggered offset -
              // keeps them perpetually out of phase with each other so the dip
              // sweeps across the row like a ripple, instead of every photo
              // bobbing in unison.
              animationDelay: `${i * 0.25}s`,
            }}
          >
            <Image src={src} alt={i === 0 ? alt : ""} fill sizes="220px" className="object-cover" />
          </div>
        );
      })}
    </div>
  );
}
