"use client";

import { Children, isValidElement, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Drift speed: 20px a second, a slow, steady glide.
const SPEED_PX_PER_MS = 20 / 1000;
// The track holds four identical copies and the drift runs across the
// second one (from -25% to -50%), so there's a full copy of slack on either
// side for the arrows and swipes to move into without ever showing an edge.
const COPIES = 4;
const LIVE_COPY = 1;
// How long the drift waits after the shopper moves the row themselves.
const HOLD_AFTER_ARROW_MS = 2500;
const HOLD_AFTER_SWIPE_MS = 1000;
const NUDGE_MS = 500;
// A touch has to travel this far sideways before it counts as a swipe.
const SWIPE_SLOP_PX = 10;

function mod(value: number, by: number) {
  return ((value % by) + by) % by;
}

const ARROW_CLASS =
  "absolute top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-md border-2 border-line bg-paper/95 text-signal shadow-lg transition-colors hover:bg-paper tap-highlight-none md:h-10 md:w-10";

/** An endless row that drifts slowly to the left, pausing while hovered,
 * with arrows that page it by most of its width and swipe/trackpad dragging.
 *
 * The drift is a Web Animations API transform (element.animate), which the
 * browser runs on its compositor thread - it stays smooth however busy the
 * page is, and scrolling never pauses it. Arrows and swipes move the same
 * animation's clock instead of scrolling anything, so the loop never runs
 * out: the copies are identical, and wrapping around is invisible.
 *
 * `minItems` repeats a short list inside each copy until a copy is at least
 * that many items long, so even a few items fill a wide screen. Arrow paging
 * needs a copy at least 0.9x the screen width to never reveal an edge; the
 * default of 8 product cards (about 1730px) covers screens up to 1920px, and
 * on wider ones the page step is capped to keep it safe. */
export function Rail({
  children,
  label,
  gapClassName,
  minItems = 8,
}: {
  children: React.ReactNode;
  label: string;
  /** The gap between items, as matching gap and right-padding classes (the
   * padding gives each copy its trailing gap, so copies tile exactly). */
  gapClassName: string;
  minItems?: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const liveCopyRef = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);
  const hovered = useRef(false);
  const holdUntil = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nudging = useRef(false);
  const reducedMotion = useRef(false);
  const swipe = useRef<{ x: number; y: number; time: number; id: number; active: boolean } | null>(null);
  const dragged = useRef(false);

  const items = Children.toArray(children);
  const repeats = Math.max(1, Math.ceil(minItems / Math.max(1, items.length)));

  /** Runs the drift unless something is holding it. */
  function sync() {
    const a = anim.current;
    if (!a) return;
    const held = hovered.current || nudging.current || swipe.current?.active || Date.now() < holdUntil.current;
    if (held || reducedMotion.current) a.pause();
    else a.play();
  }

  function holdFor(ms: number) {
    holdUntil.current = Date.now() + ms;
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(sync, ms);
    sync();
  }

  /** Moves the row by `px` (positive = onward, to the left) instantly. */
  function shiftBy(px: number) {
    const a = anim.current;
    if (!a?.effect) return;
    const duration = Number(a.effect.getTiming().duration);
    a.currentTime = mod(Number(a.currentTime ?? 0) + px / SPEED_PX_PER_MS, duration);
  }

  useEffect(() => {
    const track = trackRef.current;
    const copy = liveCopyRef.current;
    if (!track || !copy) return;
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const a = track.animate(
      [{ transform: "translate3d(-25%, 0, 0)" }, { transform: "translate3d(-50%, 0, 0)" }],
      { duration: 1000, iterations: Infinity, easing: "linear" }
    );
    a.pause();
    anim.current = a;

    // One copy's width sets the loop length (and so the speed). Measured
    // again whenever it changes (a breakpoint changing the gap, fonts
    // loading), keeping the row exactly where it was.
    const observer = new ResizeObserver(() => {
      const width = copy.offsetWidth;
      if (!width || !a.effect) return;
      const previous = Number(a.effect.getTiming().duration);
      const progress = mod(Number(a.currentTime ?? 0), previous) / previous;
      const next = width / SPEED_PX_PER_MS;
      a.effect.updateTiming({ duration: next });
      a.currentTime = progress * next;
      sync();
    });
    observer.observe(copy);

    // Only the first set of items in the live copy is reachable by keyboard
    // and screen readers; everything aria-hidden is a look-alike for the loop.
    track.querySelectorAll('[aria-hidden="true"] :is(a, button)').forEach((el) => {
      el.setAttribute("tabindex", "-1");
    });

    // Sideways trackpad swipes move the row; mostly-vertical wheel movement
    // is left alone so the page still scrolls.
    const viewport = viewportRef.current;
    function handleWheel(e: WheelEvent) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      shiftBy(e.deltaX);
      holdFor(HOLD_AFTER_SWIPE_MS);
    }
    viewport?.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      observer.disconnect();
      viewport?.removeEventListener("wheel", handleWheel);
      clearTimeout(holdTimer.current);
      a.cancel();
      anim.current = null;
    };
    // sync/shiftBy/holdFor only read refs, so the setup runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Pages the row by most of its visible width with a short eased glide,
   * then folds that glide into the drift's clock - same picture, so the
   * hand-over is invisible. */
  function nudge(dir: 1 | -1) {
    const shift = shiftRef.current;
    const viewport = viewportRef.current;
    const copy = liveCopyRef.current;
    if (!shift || !viewport || !copy || nudging.current) return;
    const px = Math.min(Math.max(viewport.clientWidth * 0.8, 280), copy.offsetWidth * 0.9) * dir;
    nudging.current = true;
    holdFor(HOLD_AFTER_ARROW_MS);
    shift.style.transition = `transform ${NUDGE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    shift.style.transform = `translate3d(${-px}px, 0, 0)`;
    const settle = () => {
      shift.removeEventListener("transitionend", settle);
      shift.style.transition = "none";
      shift.style.transform = "";
      shiftBy(px);
      nudging.current = false;
      sync();
    };
    shift.addEventListener("transitionend", settle);
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragged.current = false;
    if (e.pointerType === "mouse") return;
    swipe.current = { x: e.clientX, y: e.clientY, time: Number(anim.current?.currentTime ?? 0), id: e.pointerId, active: false };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const s = swipe.current;
    const a = anim.current;
    if (!s || s.id !== e.pointerId || !a?.effect) return;
    const dx = e.clientX - s.x;
    if (!s.active) {
      if (Math.abs(dx) < SWIPE_SLOP_PX || Math.abs(dx) < Math.abs(e.clientY - s.y)) return;
      s.active = true;
      dragged.current = true;
      sync();
    }
    // The row follows the finger: dragging right moves it back.
    const duration = Number(a.effect.getTiming().duration);
    a.currentTime = mod(s.time - dx / SPEED_PX_PER_MS, duration);
  }

  function endSwipe() {
    const wasActive = swipe.current?.active;
    swipe.current = null;
    if (wasActive) holdFor(HOLD_AFTER_SWIPE_MS);
  }

  return (
    <div
      className="relative"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        hovered.current = true;
        sync();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        hovered.current = false;
        sync();
      }}
    >
      {/* overflow-clip, not hidden: a hidden box can still be scrolled by
          focus moving into it, which would throw the loop off. touch-action
          pan-y keeps vertical page scrolling native and hands sideways
          swipes to the handlers. */}
      <div
        ref={viewportRef}
        role="region"
        aria-label={label}
        className="overflow-clip px-12 pb-4 pt-2 md:px-14"
        style={{ touchAction: "pan-y pinch-zoom" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
        onClickCapture={(e) => {
          // A swipe that ends over a card isn't a tap on it.
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
            dragged.current = false;
          }
        }}
      >
        <div ref={shiftRef}>
          <div ref={trackRef} className="flex w-max">
            {Array.from({ length: COPIES }).map((_, copy) => (
              <div
                key={copy}
                ref={copy === LIVE_COPY ? liveCopyRef : undefined}
                aria-hidden={copy === LIVE_COPY ? undefined : true}
                className={`flex shrink-0 ${gapClassName}`}
              >
                {Array.from({ length: repeats }).flatMap((_, repeat) =>
                  items.map((child, i) => (
                    <div
                      key={`${repeat}-${isValidElement(child) ? child.key : i}`}
                      aria-hidden={copy === LIVE_COPY && repeat > 0 ? true : undefined}
                      className="shrink-0"
                    >
                      {child}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <button type="button" onClick={() => nudge(-1)} aria-label={`Scroll ${label} back`} className={`left-0 ${ARROW_CLASS}`}>
        <ChevronLeft className="h-5 w-5 md:h-4 md:w-4" />
      </button>
      <button type="button" onClick={() => nudge(1)} aria-label={`Scroll ${label} forward`} className={`right-0 ${ARROW_CLASS}`}>
        <ChevronRight className="h-5 w-5 md:h-4 md:w-4" />
      </button>
    </div>
  );
}
