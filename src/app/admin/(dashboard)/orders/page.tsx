import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { OrderFilters } from "@/components/admin/order-filters";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Manage Orders" };
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-gold/15 text-gold",
  CONFIRMED: "bg-forest/15 text-forest",
  SHIPPED: "bg-ink/10 text-ink",
  DELIVERED: "bg-forest/15 text-forest",
  CANCELLED: "bg-signal/15 text-signal",
};

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const get = (key: string) => {
    const v = resolved[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const q = get("q")?.trim();
  const status = get("status");

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { customerName: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const [orders, statusCounts] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status]));

  return (
    <div>
      <h1 className="font-display text-3xl italic">Orders</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-xl border hairline bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{s}</p>
            <p className="mt-1 font-display text-2xl">{countByStatus[s] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <OrderFilters />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border hairline bg-paper">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hairline last:border-0">
                <td className="px-5 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium hover:text-signal">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <p>{order.customerName}</p>
                  <p className="text-xs text-ink-soft">{order.email}</p>
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  {order.paymentMethod} · {order.paymentStatus}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLE[order.status] ?? ""
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-3">{formatPrice(order.total)}</td>
                <td className="px-5 py-3 text-ink-soft">
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">
            {q || status ? "No orders match your filters." : "No orders yet."}
          </p>
        )}
      </div>
    </div>
  );
}
