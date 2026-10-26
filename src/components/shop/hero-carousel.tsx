"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";

type Slide = {
  id: string;
  tagline: string;
  heading: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  productHref: string;
  images: string[];
};

// Each photo stays up this long before the next one slides in.
const FRAME_MS = 5000;

// A swipe has to travel at least this far, and clearly more sideways than
// up/down, to change photo - anything else is left to the browser as a
// normal vertical page scroll.
const SWIPE_MIN_PX = 45;

// A soft shadow lifts the words off the photo on phones; the plain desktop
// background doesn't need one.
const ON_PHOTO_SHADOW = "[text-shadow:0_2px_4px_rgb(0_0_0/0.5)] lg:[text-shadow:none]";

type Frame = { key: string; slide: Slide; src: string };

/** One photo of one section, with that section's words. Phones: the photo
 * fills the width and the words sit over its darkened lower part. lg and
 * up: words on the left half, photo on the right. */
function HeroFrame({ frame, first, current }: { frame: Frame; first: boolean; current: boolean }) {
  const { slide, src } = frame;
  const headingLines = slide.heading.split("\n");
  return (
    <div inert={!current} className="relative min-w-full lg:flex lg:items-stretch">
      <div className="relative h-[70vh] min-h-[500px] bg-surface/20 lg:order-2 lg:h-auto lg:flex-1">
        {src && (
          <Image
            src={src}
            alt={slide.tagline}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            loading={first ? "eager" : "lazy"}
            fetchPriority={first ? "high" : undefined}
            className="object-cover object-top lg:object-[50%_25%]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-band/85 via-band/30 to-transparent lg:hidden" />
        {slide.productHref && (
          <Link href={slide.productHref} aria-label={`View ${slide.tagline}`} className="absolute inset-0" />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 pb-8 lg:static lg:order-1 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 lg:py-16 xl:px-20">
        <p className="mb-2 hidden font-display text-5xl font-bold lg:block">{STORE_NAME}</p>
        <p className={`mb-2 text-base font-semibold text-champagne lg:mb-4 lg:text-lg lg:text-signal ${ON_PHOTO_SHADOW}`}>
          {slide.tagline}
        </p>
        <h1
          className={`mb-4 font-display text-2xl font-bold text-band-fg lg:text-4xl lg:text-ink xl:text-5xl ${ON_PHOTO_SHADOW}`}
        >
          {headingLines.map((line, j) => (
            <span key={j}>
              {line}
              {j < headingLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className="mb-6 hidden max-w-md whitespace-pre-wrap text-ink-soft lg:block">{slide.description}</p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href={slide.primaryHref}
            className="inline-flex h-10 items-center justify-center self-start rounded-md border border-gold bg-signal px-4 text-sm font-medium text-band-fg transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-xl lg:h-11 lg:px-8"
          >
            {slide.primaryLabel}
          </Link>
          {slide.secondaryLabel && slide.secondaryHref && (
            <Link
              href={slide.secondaryHref}
              className="hidden h-11 items-center justify-center rounded-md border border-signal bg-cream px-8 text-sm font-medium text-signal transition-colors hover:bg-signal hover:text-paper lg:inline-flex"
            >
              {slide.secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  // Every photo of every section is a frame of its own, in order.
  const frames: Frame[] = slides.flatMap((slide) =>
    (slide.images.length > 0 ? slide.images : [""]).map((src, i) => ({ key: `${slide.id}-${i}`, slide, src }))
  );
  const count = frames.length;
  const [index, setIndex] = useState(0);
  const active = count > 0 ? index % count : 0;

  // Restarts from a full turn whenever the frame changes, so a dot tap or a
  // swipe never gets cut short.
  useEffect(() => {
    if (count <= 1) return;
    const timeout = setTimeout(() => setIndex((i) => (i + 1) % count), FRAME_MS);
    return () => clearTimeout(timeout);
  }, [index, count]);

  // Touch/pen swipes only. A vertical drag makes the browser scroll the
  // page and fire pointercancel instead, which just discards the gesture.
  const swipeStart = useRef<{ x: number; y: number; id: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;
    swipeStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }

  function handlePointerUp(e: React.PointerEvent) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.id !== e.pointerId || count <= 1) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    setIndex((active + (dx < 0 ? 1 : -1) + count) % count);
  }

  if (count === 0) return null;

  return (
    // The frames sit side by side and the row slides by whole widths - a
    // CSS transition on transform, which the browser runs on its compositor
    // thread, so it stays smooth however busy the page is.
    <section
      className="relative w-full overflow-hidden bg-band lg:bg-gradient-to-br lg:from-cream lg:to-surface"
      style={{ touchAction: "pan-y pinch-zoom" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeStart.current = null;
      }}
    >
      <div
        className="flex transition-transform duration-700 ease-in-out motion-reduce:transition-none lg:min-h-[500px]"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {frames.map((frame, i) => (
          <HeroFrame key={frame.key} frame={frame} first={i === 0} current={i === active} />
        ))}
      </div>

      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 lg:bottom-4">
          {frames.map((frame, i) => (
            <button
              key={frame.key}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 w-2 rounded-full ${i === active ? "bg-gold" : "bg-band-fg/60 lg:bg-ink/25"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
