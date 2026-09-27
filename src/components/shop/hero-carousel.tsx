"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PhotoTreeBackground } from "./photo-tree";
import { PhotoStack, photoIntervalMs } from "./photo-stack";
import { useIsPortrait } from "@/lib/use-is-portrait";

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

// How long each section stays up before the carousel moves on. A section's
// photos share this time evenly (1 photo: all of it, 4 photos: a quarter
// each), so every section takes the same time however many photos it has.
const SECTION_MS = 6000;

// A swipe has to travel at least this far, and clearly more sideways than
// up/down, to change section - anything else is left to the browser as a
// normal vertical page scroll.
const SWIPE_MIN_PX = 45;

// Always enters from the right and exits to the left - a consistent "turning
// a page" feel, for a new photo and a new section alike. Transform and
// opacity only: an animated blur filter repaints the whole photo every frame
// and stutters, while these two run smoothly on the compositor.
const IMAGE_VARIANTS = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: "0%", opacity: 1 },
  exit: { x: "-100%", opacity: 0 },
};

// Smoked (dark) glass with a fixed white icon, not a theme token: the arrows
// sit on photos, which are mostly light, and a pale glass or a theme colour
// (cream turns dark in the dark themes) disappears against them.
const ARROW_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/45";

function SlideText({ slide, portrait }: { slide: Slide; portrait: boolean }) {
  const headingLines = slide.heading.split("\n");
  return (
    <div className={portrait ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-signal">{slide.tagline}</p>
      <h1 className="mt-4 min-h-[2.2em] font-display text-4xl italic leading-[1.05] sm:text-5xl lg:text-5xl">
        {headingLines.map((line, j) => (
          <span key={j}>
            {line}
            {j < headingLines.length - 1 && <br />}
          </span>
        ))}
      </h1>
      <p
        className={
          portrait
            ? "mx-auto mt-6 max-w-md text-ink-soft"
            : "mt-6 line-clamp-3 min-h-[4.9em] max-w-md leading-relaxed text-ink-soft"
        }
      >
        {slide.description}
      </p>

      <div className={`mt-8 flex flex-wrap items-center gap-4 ${portrait ? "justify-center" : "justify-start"}`}>
        <Link
          href={slide.primaryHref}
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal"
        >
          {slide.primaryLabel}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
        {slide.secondaryLabel && slide.secondaryHref && (
          <Link
            href={slide.secondaryHref}
            className="text-sm font-medium underline decoration-line underline-offset-4 hover:decoration-signal"
          >
            {slide.secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const isPortrait = useIsPortrait();
  // Which of the active section's own photos the landscape image panel shows.
  const [imageIndex, setImageIndex] = useState(0);

  const slide = slides[index] as Slide | undefined;
  const panelImages = slide?.images ?? [];
  // Anything at all to move on to - another photo in this section, or
  // another section.
  const canStep = slides.length > 1 || panelImages.length > 1;

  // imageIndex is reset in the same update as the section change, so the new
  // section never renders for a frame with the old section's photo index.
  const goToSlide = useCallback((next: number) => {
    setIndex(next);
    setImageIndex(0);
  }, []);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
    setImageIndex(0);
  }, [slides.length]);

  // The automatic cycle: every photo of section 1, then every photo of
  // section 2, and so on, wrapping around.
  const stepForward = useCallback(() => {
    if (imageIndex < panelImages.length - 1) setImageIndex(imageIndex + 1);
    else if (slides.length > 1) advance();
    else setImageIndex(0);
  }, [advance, imageIndex, panelImages.length, slides.length]);

  // Arrow clicks jump straight to the previous/next section rather than
  // stepping through the current section's photos first - with only one
  // section, they step through its photos instead.
  const jump = useCallback(
    (delta: 1 | -1) => {
      if (slides.length > 1) goToSlide((index + delta + slides.length) % slides.length);
      else if (panelImages.length > 1) {
        setImageIndex((i) => (i + delta + panelImages.length) % panelImages.length);
      }
    },
    [goToSlide, index, panelImages.length, slides.length]
  );

  // Restarts from a full photo turn whenever the photo or section changes, so
  // an arrow click doesn't get cut short by the timer.
  const photoMs = photoIntervalMs(panelImages.length, SECTION_MS);
  useEffect(() => {
    if (isPortrait || !canStep) return;
    const timeout = setTimeout(stepForward, photoMs);
    return () => clearTimeout(timeout);
  }, [imageIndex, index, isPortrait, canStep, stepForward, photoMs]);

  const panelImage = panelImages[imageIndex];

  // Touch/pen swipes only - a mouse drag on desktop is left alone (desktop
  // has the arrows). A vertical drag makes the browser scroll the page and
  // fire pointercancel instead, which just discards the gesture.
  const swipeStart = useRef<{ x: number; y: number; id: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;
    swipeStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }

  function handlePointerUp(e: React.PointerEvent) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    jump(dx < 0 ? 1 : -1);
  }

  return (
    // overflow-hidden: the waiting (inactive) section sits 12px to the right
    // ready to glide in, which otherwise pokes past the screen edge on phones.
    // touch-action pan-y: the browser keeps native vertical scrolling (and
    // pinch zoom) but hands horizontal swipes to the handlers above.
    <div
      className="bg-jaali overflow-hidden"
      style={{ touchAction: "pan-y pinch-zoom" }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeStart.current = null;
      }}
    >
      {isPortrait ? (
        <div className="grid">
          {slides.map((s, i) => {
            const active = i === index;
            return (
              <div
                key={s.id}
                aria-hidden={!active}
                className="relative col-start-1 row-start-1 flex min-h-[420px] flex-col justify-center overflow-hidden transition-[opacity,transform] duration-700 ease-out"
                style={{
                  opacity: active ? 1 : 0,
                  transform: active ? "translateX(0)" : "translateX(12px)",
                  pointerEvents: active ? "auto" : "none",
                }}
              >
                <PhotoTreeBackground />
                <section className="relative z-10 mx-auto max-w-7xl px-5 pb-2 pt-10 text-center sm:px-8">
                  <SlideText slide={s} portrait />
                  <div className="mt-8">
                    <PhotoStack
                      key={String(active)}
                      images={s.images}
                      alt={s.tagline}
                      sectionMs={SECTION_MS}
                      active={active}
                      onAllShown={slides.length > 1 ? advance : undefined}
                    />
                  </div>
                </section>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative min-h-[480px] overflow-hidden">
          <PhotoTreeBackground />
          <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-16">
            {/* Every section's text is stacked in the same grid cell and
                cross-faded, so the column is always as tall as the tallest
                section's text and nothing around it shifts on a change. */}
            <div className="grid">
              {slides.map((s, i) => {
                const active = i === index;
                return (
                  <div
                    key={s.id}
                    aria-hidden={!active}
                    className="col-start-1 row-start-1 transition-[opacity,transform] duration-700 ease-out"
                    style={{
                      opacity: active ? 1 : 0,
                      transform: active ? "translateX(0)" : "translateX(12px)",
                      pointerEvents: active ? "auto" : "none",
                    }}
                  >
                    <SlideText slide={s} portrait={false} />
                  </div>
                );
              })}
            </div>

            <div className="relative aspect-[4/5] w-full max-w-sm justify-self-center overflow-hidden rounded-3xl bg-surface lg:max-w-md lg:justify-self-end">
              {canStep && (
                <>
                  <button
                    type="button"
                    onClick={() => jump(-1)}
                    aria-label={slides.length > 1 ? "Previous section" : "Previous photo"}
                    className={`absolute left-3 top-1/2 z-20 -translate-y-1/2 ${ARROW_CLASS}`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => jump(1)}
                    aria-label={slides.length > 1 ? "Next section" : "Next photo"}
                    className={`absolute right-3 top-1/2 z-20 -translate-y-1/2 ${ARROW_CLASS}`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <AnimatePresence initial={false}>
                {slide && panelImage && (
                  <motion.div
                    key={`${slide.id}-${imageIndex}`}
                    variants={IMAGE_VARIANTS}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={panelImage}
                      alt={slide.tagline}
                      fill
                      sizes="(min-width: 1024px) 40vw, 90vw"
                      priority
                      className="object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      )}

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 pb-8">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToSlide(i)}
              aria-label={`Show section ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-ink" : "w-1.5 bg-ink/25"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
