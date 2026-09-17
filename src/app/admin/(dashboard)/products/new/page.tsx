import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { getAvailableColors, getAvailableSizes } from "@/lib/catalog-options";

export const metadata = { title: "Add Product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, availableColors, availableSizes] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getAvailableColors(),
    getAvailableSizes(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl italic">Add product</h1>
      {categories.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          Create a category first before adding products.
        </p>
      ) : (
        <div className="mt-6">
          <ProductForm categories={categories} availableColors={availableColors} availableSizes={availableSizes} />
        </div>
      )}
    </div>
  );
}
