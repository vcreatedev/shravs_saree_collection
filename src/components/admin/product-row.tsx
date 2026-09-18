"use client";

import { useRouter } from "next/navigation";

/** Makes the whole product row clickable through to its edit page, not just
 * the "Edit" link inside it - matches the click-to-edit rows used everywhere
 * else in the admin panel (categories, hero sections). Action buttons inside
 * the row (Preview, Delete, the publish toggle) are wrapped in RowClickGuard
 * so they don't also trigger this row-level navigation. */
export function ProductRow({ id, children }: { id: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(`/admin/products/${id}/edit`)}
      className="cursor-pointer border-b hairline transition-colors last:border-0 hover:bg-ink/[0.03]"
    >
      {children}
    </tr>
  );
}
