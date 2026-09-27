"use client";

import { motion, type Variants, type Transition } from "framer-motion";

// A smooth ease-out glide (fast start, long soft landing) rather than a
// spring: a spring overshoots and oscillates, which reads as the section
// jerking into place. Only opacity and a small vertical move are animated -
// both run on the compositor, so they stay smooth mid-scroll; rotate/skew
// were dropped because they also made text shimmer while settling.
const REVEAL_TRANSITION: Transition = { duration: 0.8, ease: [0.22, 1, 0.36, 1] };

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: REVEAL_TRANSITION },
};

// Starts the reveal as the content crosses into the bottom of the screen, so
// it has already begun gliding by the time it's in full view.
const VIEWPORT = { once: true, margin: "0px 0px -8% 0px" } as const;

/** Glides a section's content into place the moment it scrolls into view -
 * the default per-section entrance used across the site. `once: true` so a
 * section doesn't replay every time it's scrolled past again. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{
        hidden: itemVariants.hidden,
        visible: { ...itemVariants.visible, transition: { ...REVEAL_TRANSITION, delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Wraps a grid of cards (product tiles, category tiles, price bands) so
 * they glide in one after another instead of all at once - pair with
 * StaggerItem on each direct child. */
export function StaggerGroup({
  children,
  className,
  stagger = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
