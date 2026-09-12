import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseImages } from "@/lib/utils";
import { DeleteProductButton } from "@/components/admin/delete-product-button";

export const metadata = { title: "Manage Products" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

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

      <div className="mt-6 overflow-x-auto rounded-2xl border hairline bg-paper">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const image = parseImages(product.images)[0];
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
            No products yet. Add your first one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
