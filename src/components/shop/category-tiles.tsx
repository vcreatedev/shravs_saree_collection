import Image from "next/image";
import Link from "next/link";
import type { Category } from "@prisma/client";
import { Reveal } from "@/components/motion/reveal";

type CategoryTile = Pick<Category, "id" | "name" | "slug" | "image">;

/** The homepage's (and preview's) "Shop by category" strip - circular
 * "story" avatars that scroll horizontally on mobile (snapping into place,
 * scrollbar hidden) and settle into a plain row on larger screens, the same
 * quick-category-shortcut pattern most shopping apps use today. Shared by
 * the real homepage and the admin preview so both always render it
 * identically. */
export function CategoryTiles({ categories }: { categories: CategoryTile[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="bg-velvet py-14">
      {/* Only the content glides in - the section and its background stay
          put, so the page never looks like it's jumping. */}
      <Reveal className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="font-display text-2xl italic">Shop by category</h2>
        <div className="scrollbar-hide mt-8 flex snap-x snap-mandatory gap-1 overflow-x-auto pb-2 portrait:gap-3 sm:grid sm:snap-none sm:grid-cols-4 sm:gap-x-0 sm:gap-y-2 sm:overflow-visible sm:portrait:gap-x-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group flex flex-shrink-0 snap-start flex-col items-center gap-3 sm:flex-shrink"
            >
              {/* The "offset ring" gap is real padding inside this box now,
                  not a box-shadow spreading past it - a ring-offset draws
                  outside the circle's own layout box, which depends on
                  however much room an ancestor happens to leave and can get
                  clipped at a container's scroll/overflow edge (as the first
                  circle's did). Nothing here extends past the box's own
                  declared size, so it can't be clipped by anything. */}
              <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border border-line transition-colors duration-300 group-hover:border-signal sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                <div className="relative h-[85%] w-[85%] overflow-hidden rounded-full">
                  {cat.image && (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="128px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                </div>
              </div>
              <p className="max-w-[100px] text-center text-xs font-medium leading-tight group-hover:text-signal sm:text-sm">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
