"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const MAX_CARDS = 4;

// Floor on how long one photo stays up, so a section with many photos never
// flashes through them faster than the transition itself.
const MIN_PHOTO_MS = 1500;

/** How long each photo stays up when a section's photos share one fixed
 * section duration - more photos means each gets a shorter turn, so every
 * section takes the same time regardless of how many photos it has. */
export function photoIntervalMs(photoCount: number, sectionMs: number): number {
  return Math.max(MIN_PHOTO_MS, sectionMs / Math.max(1, photoCount));
}

// Position 0 is the front (fully visible) card; each position after that
// sits further back in the stack - smaller, offset, and dimmer.
const POSITIONS = [
  { scale: 1, x: 0, y: 0, rotate: 0, z: 40, opacity: 1 },
  { scale: 0.94, x: 9, y: 8, rotate: 3, z: 30, opacity: 0.85 },
  { scale: 0.89, x: -8, y: 15, rotate: -4, z: 20, opacity: 0.6 },
  { scale: 0.84, x: 5, y: 20, rotate: 2, z: 10, opacity: 0.4 },
];

function advanceForward(order: number[]) {
  return [...order.slice(1), order[0]];
}

export function PhotoStack({
  images,
  alt,
  sectionMs,
  active = true,
  onAllShown,
}: {
  images: string[];
  alt: string;
  /** Total time for every photo to have its turn - split evenly across them. */
  sectionMs: number;
  /** Whether this stack is the one currently on screen - matches
   * HeroSlideshow/PhotoTree's prop so this can drop straight into the same
   * carousel slot. */
  active?: boolean;
  /** Fires once every photo has had a turn at the front - lets a parent
   * carousel move on to the next section. */
  onAllShown?: () => void;
}) {
  const photos = images.slice(0, MAX_CARDS);
  const intervalMs = photoIntervalMs(photos.length, sectionMs);
  const [order, setOrder] = useState<number[]>(() => photos.map((_, i) => i));
  // Bumped on every manual tap so the auto-rotate timer below restarts from
  // a full interval instead of firing right on top of the tap.
  const [restartTick, setRestartTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    // A single photo never rotates, so it counts as shown once it's had the
    // whole section's time.
    if (photos.length <= 1) {
      if (!onAllShown) return;
      const timeout = setTimeout(onAllShown, intervalMs);
      return () => clearTimeout(timeout);
    }
    let turnsTaken = 0;
    const interval = setInterval(() => {
      setOrder(advanceForward);
      turnsTaken += 1;
      if (turnsTaken % photos.length === 0) onAllShown?.();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [active, photos.length, onAllShown, restartTick, intervalMs]);

  function handleTap() {
    if (photos.length <= 1) return;
    setOrder(advanceForward);
    setRestartTick((t) => t + 1);
  }

  if (photos.length === 0) return null;

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-label="Show next photo"
      className="relative mx-auto block h-64 w-64 cursor-pointer"
    >
      {order.map((photoIndex, position) => {
        const spot = POSITIONS[Math.min(position, POSITIONS.length - 1)];
        return (
          <div
            key={photos[photoIndex]}
            className="absolute inset-0 overflow-hidden rounded-full border-4 border-paper bg-surface shadow-lg transition-all duration-700 ease-out"
            style={{
              transform: `translate(${spot.x}px, ${spot.y}px) scale(${spot.scale}) rotate(${spot.rotate}deg)`,
              zIndex: spot.z,
              opacity: spot.opacity,
            }}
          >
            <Image
              src={photos[photoIndex]}
              alt={position === 0 ? alt : ""}
              fill
              sizes="240px"
              className="pointer-events-none object-cover"
            />
          </div>
        );
      })}
    </button>
  );
}
