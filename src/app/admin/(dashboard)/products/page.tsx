import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseImages, parseList } from "@/lib/utils";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ProductFilters } from "@/components/admin/product-filters";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Manage Products" };
export const dynamic = "force-dynamic";

function isNewArrival(tags: string) {
  return parseList(tags).some((t) => t.toLowerCase() === "new");
}

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const get = (key: string) => {
    const v = resolved[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const category = get("category");
  const section = get("section");
  const q = get("q")?.trim();

  const where: Prisma.ProductWhereInput = {};
  if (category) where.category = { slug: category };
  if (q) {
    const asNumber = Number(q);
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      ...(Number.isFinite(asNumber) && q !== "" ? [{ price: asNumber }] : []),
    ];
  }

  const [categories, allInCategory] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const sectionCounts = {
    featured: allInCategory.filter((p) => p.featured).length,
    new: allInCategory.filter((p) => isNewArrival(p.tags)).length,
  };

  const products =
    section === "featured"
      ? allInCategory.filter((p) => p.featured)
      : section === "new"
      ? allInCategory.filter((p) => isNewArrival(p.tags))
      : allInCategory;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl italic">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream hover:bg-signal"
        >
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border hairline bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">All</p>
          <p className="mt-1 font-display text-2xl">{allInCategory.length}</p>
        </div>
        <div className="rounded-xl border hairline bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Featured (Homepage)</p>
          <p className="mt-1 font-display text-2xl">{sectionCounts.featured}</p>
        </div>
        <div className="rounded-xl border hairline bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">New Arrivals</p>
          <p className="mt-1 font-display text-2xl">{sectionCounts.new}</p>
        </div>
      </div>

      <div className="mt-6">
        <ProductFilters categories={categories} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border hairline bg-paper">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Shows on</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const image = parseImages(product.images)[0];
              const badges = [
                product.featured && "Featured",
                isNewArrival(product.tags) && "New Arrivals",
              ].filter(Boolean) as string[];
              return (
                <tr key={product.id} className="border-b hairline last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 flex-shrink-0 overflow-hidden rounded-md bg-cream">
                        {image && <Image src={image} alt={product.name} fill className="object-cover" sizes="40px" />}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{product.category.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {badges.length > 0 ? (
                        badges.map((b) => (
                          <span
                            key={b}
                            className="rounded-full bg-signal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal"
                          >
                            {b}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-ink-soft">Shop only</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">{formatPrice(product.price)}</td>
                  <td className="px-5 py-3">
                    <span className={product.stock === 0 ? "text-signal" : ""}>{product.stock}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-ink/5"
                      >
                        Edit
                      </Link>
                      <DeleteProductButton productId={product.id} name={product.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">
            {category || section || q ? "No products match your filters." : "No products yet. Add your first one to get started."}
          </p>
        )}
      </div>
    </div>
  );
}
