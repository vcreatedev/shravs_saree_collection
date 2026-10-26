import { prisma } from "./prisma";

/** Products at or below this stock count are flagged as low stock throughout
 * the admin dashboard. */
export const LOW_STOCK_THRESHOLD = 5;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** One revenue total per day for the last `days` days (today inclusive),
 * zero-filled for days with no orders - fetches once and reduces in JS
 * rather than a raw date-trunc query, matching this codebase's existing
 * style. */
export async function getRevenueSeries(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
    select: { total: true, createdAt: true },
  });

  const totals = new Map<string, number>();
  for (const order of orders) {
    const key = dayKey(order.createdAt);
    totals.set(key, (totals.get(key) ?? 0) + order.total);
  }

  const series: { date: string; revenue: number }[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(since);
    date.setDate(date.getDate() + i);
    const key = dayKey(date);
    series.push({
      date: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      revenue: totals.get(key) ?? 0,
    });
  }
  return series;
}

/** The lowest-stock published products - the ones most likely to need a
 * restock soon. */
export async function getLowStockProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { published: true },
    orderBy: { stock: "asc" },
    take: limit,
    select: { name: true, slug: true, stock: true },
  });
  return products;
}

/** Best-selling products by total quantity sold across every non-cancelled
 * order - reduced in JS from OrderItem rows rather than a cross-relation
 * Prisma groupBy, for the same "plain query + JS reduce" consistency. */
export async function getTopSellingProducts(limit = 8) {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { not: "CANCELLED" } } },
    select: { name: true, quantity: true, productId: true },
  });

  const totals = new Map<string, { name: string; quantity: number }>();
  for (const item of items) {
    const key = item.productId ?? item.name;
    const existing = totals.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      totals.set(key, { name: item.name, quantity: item.quantity });
    }
  }

  return [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}
