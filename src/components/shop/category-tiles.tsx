import Image from "next/image";
import Link from "next/link";
import type { Category } from "@prisma/client";

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
    <section className="border-y hairline bg-paper py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="font-display text-2xl italic">Shop by category</h2>
        <div className="scrollbar-hide mt-8 flex snap-x snap-mandatory gap-1 overflow-x-auto pb-2 sm:grid sm:snap-none sm:grid-cols-4 sm:gap-x-0 sm:gap-y-2 sm:overflow-visible lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group flex flex-shrink-0 snap-start flex-col items-center gap-3 sm:flex-shrink"
            >
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-line ring-offset-4 ring-offset-paper transition-all duration-300 group-hover:ring-2 group-hover:ring-signal sm:h-28 sm:w-28 lg:h-32 lg:w-32">
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
              <p className="max-w-[100px] text-center text-xs font-medium leading-tight group-hover:text-signal sm:text-sm">
                {cat.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
