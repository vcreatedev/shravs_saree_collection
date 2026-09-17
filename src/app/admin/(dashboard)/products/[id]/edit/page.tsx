import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { getAvailableColors, getAvailableSizes, getAvailableTags } from "@/lib/catalog-options";

export const metadata = { title: "Edit Product" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, availableColors, availableSizes, availableTags] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getAvailableColors(),
    getAvailableSizes(),
    getAvailableTags(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl italic">Edit product</h1>
      <div className="mt-6">
        <ProductForm
          categories={categories}
          product={product}
          availableColors={availableColors}
          availableSizes={availableSizes}
          availableTags={availableTags}
        />
      </div>
    </div>
  );
}
