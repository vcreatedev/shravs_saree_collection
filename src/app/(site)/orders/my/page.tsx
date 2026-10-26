"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { Download, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { OrderWithItems } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending payment",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function MyOrdersPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderWithItems[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/orders/my", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setOrders(data.orders);
      if (data.orders.length === 0) {
        toast("No orders found with that email and phone.", { icon: "🔍" });
      }
    } catch {
      toast.error("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
      <p className="text-xs font-semibold uppercase tracking-wide text-signal">My orders</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Your order history</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Enter the email and phone number you used at checkout to see all your past orders.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 sm:flex-row">
        <input
          required
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
        />
        <input
          required
          type="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal disabled:opacity-60"
        >
          {loading ? "Searching…" : "Find orders"}
        </button>
      </form>

      {orders && orders.length > 0 && (
        <ul className="mt-10 divide-y hairline border-y hairline">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-5 w-5 flex-shrink-0 text-ink-soft" />
                <div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="text-sm font-semibold hover:text-signal"
                  >
                    #{order.orderNumber}
                  </Link>
                  <p className="text-xs text-ink-soft">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                    {STATUS_LABEL[order.status] ?? order.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
                <a
                  href={`/api/orders/${order.id}/invoice`}
                  download
                  className="flex items-center gap-1.5 rounded-full border hairline px-4 py-2 text-xs font-semibold uppercase tracking-wide hover:border-ink"
                >
                  <Download className="h-3.5 w-3.5" /> Invoice
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {orders && orders.length === 0 && (
        <div className="mt-10 rounded-xl border hairline bg-paper py-16 text-center">
          <p className="text-lg font-semibold">No orders found</p>
          <p className="mt-2 text-sm text-ink-soft">
            Double-check the email and phone number you used at checkout.
          </p>
        </div>
      )}
    </div>
  );
}
