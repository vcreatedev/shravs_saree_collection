"use client";

import { useEffect, useState } from "react";
import { useClient } from "sanity";
import { Box, Card, Flex, Grid, Heading, Label, Spinner, Stack, Text } from "@sanity/ui";
import { formatINR, ORDERS_API_VERSION } from "./order-api";
import type { OrderStatus } from "@/types";

/* Overview: how the shop is doing - revenue, orders to pack and ship, what
   sells, and what is running out. Counts paid orders only. */

type PaidOrder = {
  total: number;
  createdAt: string;
  status: OrderStatus;
  items: { name: string; quantity: number }[] | null;
};

type LowStock = { _id: string; title: string; productCode: string | null; inStock: boolean | null; pieces: number | null };

type Data = { orders: PaidOrder[]; lowStock: LowStock[]; productCount: number };

const DAY = 24 * 60 * 60 * 1000;

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card padding={4} radius={2} border>
      <Stack gap={3}>
        <Label size={0} muted>
          {label}
        </Label>
        <Heading size={3}>{value}</Heading>
        {note && (
          <Text size={1} muted>
            {note}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

/** The figures shown, as of `now`. */
function summarize(data: Data, now: number) {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const since = (ms: number) => data.orders.filter((o) => new Date(o.createdAt).getTime() >= ms);
  const sum = (orders: PaidOrder[]) => orders.reduce((total, o) => total + (o.total || 0), 0);
  const last30 = since(now - 30 * DAY);

  // Revenue per day for the last 14 days, oldest first.
  const days = Array.from({ length: 14 }, (_, i) => {
    const start = startOfToday - (13 - i) * DAY;
    const total = sum(data.orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= start && t < start + DAY;
    }));
    return { label: new Date(start).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), total };
  });

  const sold = new Map<string, number>();
  for (const o of last30) for (const item of o.items ?? []) sold.set(item.name, (sold.get(item.name) ?? 0) + item.quantity);
  const top = [...sold.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return {
    today: sum(since(startOfToday)),
    week: sum(since(now - 7 * DAY)),
    month: sum(last30),
    monthCount: last30.length,
    average: last30.length ? sum(last30) / last30.length : 0,
    toShip: data.orders.filter((o) => o.status === "CONFIRMED").length,
    inTransit: data.orders.filter((o) => ["READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.status)).length,
    days,
    peak: Math.max(1, ...days.map((d) => d.total)),
    top,
  };
}

export function OverviewTool() {
  const client = useClient({ apiVersion: ORDERS_API_VERSION });
  const [view, setView] = useState<{ data: Data; stats: ReturnType<typeof summarize> } | null>(null);

  useEffect(() => {
    client
      .fetch<Data>(
        `{
          "orders": *[_type == "order" && _id in path("orders.*") && paymentStatus == "PAID"]{ total, createdAt, status, items[]{ name, quantity } },
          "lowStock": *[_type == "product"]{
            _id, title, productCode, inStock,
            "pieces": select(count(sizes) > 0 => math::sum(sizes[].stockQuantity), coalesce(stockQuantity, 0))
          }[inStock == false || pieces <= 2] | order(pieces asc),
          "productCount": count(*[_type == "product"])
        }`
      )
      .then((data) => setView({ data, stats: summarize(data, Date.now()) }));
  }, [client]);

  if (!view) {
    return (
      <Flex justify="center" padding={6}>
        <Spinner />
      </Flex>
    );
  }
  const { data, stats } = view;

  return (
    <Box padding={4} style={{ overflow: "auto", height: "100%" }}>
      <Stack gap={5} style={{ maxWidth: 1100 }}>
        <Heading size={2}>Overview</Heading>

        <Grid gridTemplateColumns={[1, 2, 4]} gap={3}>
          <Stat label="Revenue today" value={formatINR(stats.today)} />
          <Stat label="Last 7 days" value={formatINR(stats.week)} />
          <Stat label="Last 30 days" value={formatINR(stats.month)} note={`${stats.monthCount} orders · avg ${formatINR(stats.average)}`} />
          <Stat label="Waiting to ship" value={String(stats.toShip)} note={`${stats.inTransit} on the way to customers`} />
        </Grid>

        <Card padding={4} radius={2} border>
          <Stack gap={4}>
            <Label size={0} muted>
              Revenue, last 14 days
            </Label>
            <Flex align="flex-end" gap={2} style={{ height: 140 }}>
              {stats.days.map((day) => (
                <Flex key={day.label} direction="column" align="center" justify="flex-end" flex={1} style={{ height: "100%" }} title={`${day.label}: ${formatINR(day.total)}`}>
                  <Box
                    style={{
                      width: "100%",
                      height: `${Math.max(2, (day.total / stats.peak) * 110)}px`,
                      background: "#8b1645",
                      borderRadius: 3,
                      opacity: day.total ? 1 : 0.25,
                    }}
                  />
                  <Text size={0} muted style={{ marginTop: 6, whiteSpace: "nowrap" }}>
                    {day.label.split(" ")[0]}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Stack>
        </Card>

        <Grid gridTemplateColumns={[1, 1, 2]} gap={3}>
          <Card padding={4} radius={2} border>
            <Stack gap={3}>
              <Label size={0} muted>
                Best sellers, last 30 days
              </Label>
              {stats.top.length === 0 ? (
                <Text size={1} muted>
                  No paid orders yet.
                </Text>
              ) : (
                stats.top.map(([name, quantity]) => (
                  <Flex key={name} justify="space-between" gap={3}>
                    <Text size={1} textOverflow="ellipsis">
                      {name}
                    </Text>
                    <Text size={1}>{quantity} sold</Text>
                  </Flex>
                ))
              )}
            </Stack>
          </Card>

          <Card padding={4} radius={2} border tone={data.lowStock.length ? "caution" : "default"}>
            <Stack gap={3}>
              <Label size={0} muted>
                Low or out of stock ({data.lowStock.length} of {data.productCount} products)
              </Label>
              {data.lowStock.length === 0 ? (
                <Text size={1} muted>
                  Everything has more than 2 pieces in stock.
                </Text>
              ) : (
                data.lowStock.slice(0, 10).map((p) => (
                  <Flex key={p._id} justify="space-between" gap={3}>
                    <Text size={1} textOverflow="ellipsis">
                      {p.title} {p.productCode ? `(${p.productCode})` : ""}
                    </Text>
                    <Text size={1}>{p.inStock === false ? "Turned off" : `${p.pieces ?? 0} left`}</Text>
                  </Flex>
                ))
              )}
            </Stack>
          </Card>
        </Grid>
      </Stack>
    </Box>
  );
}
