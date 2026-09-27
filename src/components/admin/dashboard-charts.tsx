"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import { LOW_STOCK_THRESHOLD } from "@/lib/dashboard";

const AXIS_STYLE = { fontSize: 12, fill: "var(--color-ink-soft)" };

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border hairline bg-paper p-5">
      <h3 className="font-display text-lg italic">{title}</h3>
      <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border hairline bg-paper px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{label}</p>
      <p className="text-ink-soft">{formatPrice(payload[0].value)}</p>
    </div>
  );
}

export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  // Thinning the x-axis ticks so ~30 daily labels don't collide - every 5th
  // day's label is shown, always including the most recent day.
  const tickIndices = new Set<string>();
  data.forEach((d, i) => {
    if (i % 5 === 0 || i === data.length - 1) tickIndices.add(d.date);
  });

  return (
    <ChartCard title="Revenue" subtitle="Last 30 days">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-signal)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--color-signal)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="date"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line)" }}
              interval={0}
              tickFormatter={(value) => (tickIndices.has(value) ? value : "")}
            />
            <YAxis
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={0}
              tickFormatter={(value) => (value === 0 ? "" : formatPrice(value))}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-signal)"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function StockChart({ data }: { data: { name: string; slug: string; stock: number }[] }) {
  const height = Math.max(160, data.length * 36);
  return (
    <ChartCard title="Stock levels" subtitle="Lowest-stock products">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
            barCategoryGap={10}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={140}
              tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 17)}…` : value)}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface)" }}
              formatter={(value) => [`${value} in stock`, ""]}
              labelFormatter={(label) => label}
              contentStyle={{
                background: "var(--color-paper)",
                border: "1px solid var(--color-line)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="stock" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((item) => (
                <Cell
                  key={item.slug}
                  fill={item.stock <= LOW_STOCK_THRESHOLD ? "var(--color-signal)" : "var(--color-ink-soft)"}
                />
              ))}
              <LabelList dataKey="stock" position="right" style={{ fill: "var(--color-ink)", fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-signal)" }} />
          Low stock (≤ {LOW_STOCK_THRESHOLD})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-ink-soft)" }} />
          In stock
        </span>
      </div>
    </ChartCard>
  );
}

export function TopProductsChart({ data }: { data: { name: string; quantity: number }[] }) {
  const height = Math.max(160, data.length * 36);
  return (
    <ChartCard title="Top-selling products" subtitle="By units sold">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
            barCategoryGap={10}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={140}
              tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 17)}…` : value)}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface)" }}
              formatter={(value) => [`${value} sold`, ""]}
              contentStyle={{
                background: "var(--color-paper)",
                border: "1px solid var(--color-line)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="quantity" radius={[0, 4, 4, 0]} maxBarSize={18} fill="var(--color-gold)">
              <LabelList dataKey="quantity" position="right" style={{ fill: "var(--color-ink)", fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
