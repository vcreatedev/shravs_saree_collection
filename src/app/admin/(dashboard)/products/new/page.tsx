import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add Product" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-3xl italic">Add product</h1>
      {categories.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          Create a category first before adding products.
        </p>
      ) : (
        <div className="mt-6">
          <ProductForm categories={categories} />
        </div>
      )}
    </div>
  );
}
