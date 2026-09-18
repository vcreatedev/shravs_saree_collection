"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const PER_IMAGE_MS = 4500;

export function HeroSlideshow({
  images,
  alt,
  active = true,
  onAllShown,
}: {
  images: string[];
  alt: string;
  /** Whether this slideshow is the one currently on screen. While inactive it
   * stays paused on the first image, ready to start over next time it shows. */
  active?: boolean;
  /** Fires once every image has had its turn - lets a parent carousel wait
   * for the full set before moving on, instead of cutting a photo short. */
  onAllShown?: () => void;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const isLast = index >= images.length - 1;
    const timeout = setTimeout(() => {
      // Notify on completing a full pass (a multi-section carousel uses this
      // to move on), but keep looping regardless - with just one section
      // there's nothing else to move on to, so the images should cycle
      // continuously instead of freezing on the last one.
      if (isLast) onAllShown?.();
      setIndex((i) => (i + 1) % images.length);
    }, PER_IMAGE_MS);
    return () => clearTimeout(timeout);
  }, [active, index, images.length, onAllShown]);

  return (
    <>
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          fill
          priority={i === 0}
          sizes="(orientation: landscape) 50vw, 100vw"
          className={`object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </>
  );
}
