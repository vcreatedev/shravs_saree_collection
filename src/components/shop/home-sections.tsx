import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/types";
import { ProductCarousel, SwitchableProducts, type RowBadges } from "./product-rows";

/** Vertical rhythm and full-width gutter shared by every homepage section. */
export const SECTION_CLASS = "w-full py-5 sm:py-6 lg:py-8";
export const SECTION_INNER_CLASS = "w-full px-4";

/** The centred heading every homepage section opens with: an optional pill
 * label, the title, and an optional line of copy. `highlight` makes the pill
 * gold with a star (the best-seller row); `serif` sets the title in the
 * display face. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  highlight,
  serif,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  highlight?: boolean;
  serif?: boolean;
}) {
  return (
    <div className="mb-6 text-center sm:mb-8 lg:mb-12">
      {eyebrow && (
        <span
          className={`mb-4 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            highlight ? "border-gold bg-paper text-ink" : "border-transparent bg-surface text-ink"
          }`}
        >
          {highlight && <Star className="mr-1 h-3 w-3 fill-current text-gold" />}
          {eyebrow}
        </span>
      )}
      <h2 className={`mb-4 text-3xl font-bold md:text-4xl ${serif ? "font-display" : ""}`}>{title}</h2>
      {subtitle && <p className="mx-auto max-w-2xl text-ink-soft">{subtitle}</p>}
    </div>
  );
}

export function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="mt-4 text-center sm:mt-6">
      <Link
        href={href}
        className="inline-flex h-11 items-center justify-center rounded-md border border-signal bg-cream px-8 text-sm font-medium text-signal transition-colors hover:bg-signal hover:text-paper"
      >
        {label}
      </Link>
    </div>
  );
}

/** A homepage section of product cards under a heading, over a "View all"
 * link - a row drifting endlessly, or with `layoutSwitch`, a grid that
 * shoppers can switch to that row. `badges` pins a "NEW" tag or a
 * best-seller ranking to every card. Renders nothing for an empty list. */
export function ProductRailSection({
  eyebrow,
  title,
  products,
  href,
  linkLabel,
  badges,
  highlight,
  layoutSwitch,
  tone,
}: {
  eyebrow: string;
  title: string;
  products: Product[];
  href: string;
  linkLabel: string;
  badges?: RowBadges;
  highlight?: boolean;
  layoutSwitch?: boolean;
  /** A cream beige section instead of the ivory one, to set it apart from
   * its neighbours. */
  tone?: "cream";
}) {
  if (products.length === 0) return null;

  return (
    <section className={`${SECTION_CLASS} ${tone === "cream" ? "bg-surface" : "bg-cream"}`}>
      <div className={SECTION_INNER_CLASS}>
        <SectionHeading eyebrow={eyebrow} title={title} highlight={highlight} />
        {layoutSwitch ? (
          <SwitchableProducts title={title} products={products} badges={badges} />
        ) : (
          <ProductCarousel title={title} products={products} badges={badges} />
        )}
        <ViewAllLink href={href} label={linkLabel} />
      </div>
    </section>
  );
}
