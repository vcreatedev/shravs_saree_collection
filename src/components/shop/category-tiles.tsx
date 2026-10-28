import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types";
import { SECTION_CLASS, SECTION_INNER_CLASS, SectionHeading } from "./home-sections";
import { Rail } from "./rail";

type CategoryTile = Pick<Category, "id" | "name" | "slug" | "image">;

/** The homepage's (and preview's) "Shop by category" row - large circular
 * photos with the category name beneath, drifting endlessly like the product
 * rows. Shared by the real homepage and the admin preview so both always
 * render it identically. */
export function CategoryTiles({ categories }: { categories: CategoryTile[] }) {
  if (categories.length === 0) return null;

  return (
    <section className={`${SECTION_CLASS} bg-surface/30`}>
      <div className={SECTION_INNER_CLASS}>
        <SectionHeading
          serif
          title="Shop by Category"
          subtitle="Explore our handpicked sarees and ethnic wear, for every occasion."
        />
        <Rail label="Categories" gapClassName="gap-6 pr-6 md:gap-8 md:pr-8">
          {categories.map((cat) => (
            <Link key={cat.id} href={`/shop?category=${cat.slug}`} className="group flex flex-col items-center">
              <span className="relative block h-32 w-32 overflow-hidden rounded-full bg-cream shadow-lg ring-1 ring-gold/50 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl md:h-40 md:w-40">
                {cat.image && (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="160px"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
                  />
                )}
              </span>
              <span className="mt-3 whitespace-nowrap text-center text-sm font-medium uppercase transition-colors group-hover:text-signal md:text-base">
                {cat.name}
              </span>
            </Link>
          ))}
        </Rail>
      </div>
    </section>
  );
}
