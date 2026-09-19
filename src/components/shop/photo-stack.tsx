"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const ROTATE_MS = 2600;
const MAX_CARDS = 4;

// Position 0 is the front (fully visible) card; each position after that
// sits further back in the stack - smaller, offset, and dimmer.
const POSITIONS = [
  { scale: 1, x: 0, y: 0, rotate: 0, z: 40, opacity: 1 },
  { scale: 0.94, x: 9, y: 8, rotate: 3, z: 30, opacity: 0.85 },
  { scale: 0.89, x: -8, y: 15, rotate: -4, z: 20, opacity: 0.6 },
  { scale: 0.84, x: 5, y: 20, rotate: 2, z: 10, opacity: 0.4 },
];

export function PhotoStack({
  images,
  alt,
  active = true,
  onAllShown,
}: {
  images: string[];
  alt: string;
  /** Whether this stack is the one currently on screen - matches
   * HeroSlideshow/PhotoTree's prop so this can drop straight into the same
   * carousel slot. */
  active?: boolean;
  /** Fires once every photo has had a turn at the front - lets a parent
   * carousel move on to the next section. */
  onAllShown?: () => void;
}) {
  const photos = images.slice(0, MAX_CARDS);
  const [order, setOrder] = useState<number[]>(() => photos.map((_, i) => i));

  useEffect(() => {
    if (!active || photos.length <= 1) return;
    let turnsTaken = 0;
    const interval = setInterval(() => {
      // The front card rotates to the back of the stack, looping through
      // every photo circularly instead of settling once it reaches the end.
      setOrder((current) => [...current.slice(1), current[0]]);
      turnsTaken += 1;
      if (turnsTaken % photos.length === 0) onAllShown?.();
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, [active, photos.length, onAllShown]);

  if (photos.length === 0) return null;

  return (
    <div className="relative mx-auto h-64 w-64">
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
              className="object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
