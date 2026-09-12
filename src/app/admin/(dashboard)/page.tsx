import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [orderCount, productCount, pendingCount, revenue, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const stats = [
    { label: "Total revenue", value: formatPrice(revenue._sum.total ?? 0) },
    { label: "Orders", value: orderCount },
    { label: "Pending orders", value: pendingCount },
    { label: "Products", value: productCount },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl italic">Dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border hairline bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-2xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border hairline bg-paper p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl italic">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium hover:text-signal">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b hairline text-xs uppercase tracking-wide text-ink-soft">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b hairline last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:text-signal">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{order.customerName}</td>
                    <td className="py-3 pr-4">{order.status}</td>
                    <td className="py-3 pr-4">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
