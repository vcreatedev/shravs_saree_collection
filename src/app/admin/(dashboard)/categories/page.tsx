import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata = { title: "Manage Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-3xl italic">Categories</h1>
      <div className="mt-6">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
