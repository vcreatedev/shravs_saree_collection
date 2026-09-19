"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useState } from "react";
import { PhotoTree, PhotoTreeBackground } from "./photo-tree";
import { PhotoStack } from "./photo-stack";
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

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const isPortrait = useIsPortrait();

  // Only the active slide's photo set drives advancing to the next section -
  // it won't move on until every one of its images has had its turn.
  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  return (
    <div>
      <div className="grid">
        {slides.map((slide, i) => {
          const headingLines = slide.heading.split("\n");
          const active = i === index;
          return (
            <div
              key={slide.id}
              aria-hidden={!active}
              className="relative col-start-1 row-start-1 flex min-h-[460px] flex-col justify-center overflow-hidden transition-[opacity,transform] duration-700 ease-out landscape:block landscape:min-h-[560px]"
              style={{
                opacity: active ? 1 : 0,
                transform: active ? "translateX(0)" : "translateX(12px)",
                pointerEvents: active ? "auto" : "none",
              }}
            >
              <PhotoTreeBackground />

              <section className="relative z-10 mx-auto max-w-7xl px-5 pb-2 pt-10 text-center sm:px-8 landscape:pt-16">
                <div className="mx-auto max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-signal">
                    {slide.tagline}
                  </p>
                  <h1 className="mt-4 font-display text-5xl italic leading-[1.05] sm:text-6xl lg:text-6xl">
                    {headingLines.map((line, j) => (
                      <span key={j}>
                        {line}
                        {j < headingLines.length - 1 && <br />}
                      </span>
                    ))}
                  </h1>
                  <p className="mx-auto mt-6 max-w-md text-ink-soft">{slide.description}</p>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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

                  <div className="mt-8 landscape:-mt-6">
                    {isPortrait ? (
                      <PhotoStack
                        key={String(active)}
                        images={slide.images}
                        alt={slide.tagline}
                        active={active}
                        onAllShown={slides.length > 1 ? advance : undefined}
                      />
                    ) : (
                      <PhotoTree
                        key={String(active)}
                        images={slide.images}
                        alt={slide.tagline}
                        active={active}
                        onAllShown={slides.length > 1 ? advance : undefined}
                      />
                    )}
                  </div>
                </div>
              </section>
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 pb-8">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setIndex(i)}
              aria-label={`Show section ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-ink" : "w-1.5 bg-ink/25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
