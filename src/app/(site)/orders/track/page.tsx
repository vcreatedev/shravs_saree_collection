"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Order not found.");
        setLoading(false);
        return;
      }
      router.push(`/orders/${data.orderId}`);
    } catch {
      toast.error("Network error, please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Track order</p>
      <h1 className="mt-2 font-display text-3xl italic">Find your order</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Enter your order number and the email you used at checkout.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          required
          placeholder="Order number (e.g. LUM-XXXX-XXXX)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="w-full rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
        />
        <input
          required
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink py-3.5 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal disabled:opacity-60"
        >
          {loading ? "Searching…" : "Find my order"}
        </button>
      </form>
    </div>
  );
}
