"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Package, Truck, Search, FileText, ArrowRight, MessageCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/order-status";
import type { Order, OrderStatus } from "@/types";

const STEPS: OrderStatus[] = ["CONFIRMED", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

const courierTrackingUrl = (carrier?: string, tracking?: string) => {
  if (!tracking) return null;
  const c = String(carrier || "").toLowerCase();
  const t = encodeURIComponent(String(tracking).trim());
  if (c.includes("delhivery")) return `https://www.delhivery.com/track/package/${t}`;
  if (c.includes("blue dart") || c.includes("bluedart")) return `https://www.bluedart.com/tracking?trackFor=0&trackNo=${t}`;
  if (c.includes("dtdc")) return "https://www.dtdc.in/";
  if (c.includes("post")) return "https://www.indiapost.gov.in/";
  if (c.includes("shadowfax")) return `https://tracker.shadowfax.in/#/track/${t}`;
  if (c.includes("shiprocket")) return `https://shiprocket.co/tracking/${t}`;
  return null;
};

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("orderId") || searchParams.get("id") || "";

  const [query, setQuery] = useState(urlOrderId);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  async function searchOrder(q: string, ep?: string) {
    if (!q.trim() && !ep?.trim()) {
      toast.error("Please enter your Order ID, Payment ID, AWB, Email or Phone.");
      return;
    }
    setQuery(q);
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim(), email: ep?.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.order) {
        setOrder(null);
        toast.error(data.error || "No matching order found.");
        return;
      }
      setOrder(data.order);
      try {
        localStorage.setItem("shravs_recent_order_id", data.order.orderNumber);
        localStorage.setItem("shravs_recent_order_ref", data.order.id);
      } catch {}
    } catch {
      toast.error("Network error, please try again.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const target = urlOrderId || (typeof window !== "undefined" ? localStorage.getItem("shravs_recent_order_id") : null);
    if (target) {
      const timer = setTimeout(() => {
        searchOrder(target);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [urlOrderId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    searchOrder(query, emailOrPhone);
  }

  const shipment = order?.shipment;
  const reached = order ? STEPS.indexOf(order.status) : -1;
  const directCourierLink = shipment?.trackingUrl || courierTrackingUrl(shipment?.courierName, shipment?.awb);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-signal">Order Tracking & Fulfilment</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">Track Your Drape</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          Enter your Order Number (e.g. SRV-XXXX), Razorpay Payment ID, Courier Tracking Number (AWB), Email or Phone.
        </p>
      </div>

      {/* Search Card */}
      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-xl rounded-2xl border hairline bg-paper p-5 sm:p-6 shadow-sm">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gold mb-1.5">
              Order ID / Payment ID / AWB / Phone
            </label>
            <div className="relative">
              <input
                required
                type="text"
                placeholder="e.g. SRV-XXXX-XXXX, pay_..., or phone number"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border hairline bg-cream/50 px-4 py-3 pl-10 text-sm focus:border-signal focus:outline-none"
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-ink-soft" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gold mb-1.5">
              Email Address (Optional Verification)
            </label>
            <input
              type="email"
              placeholder="name@example.com (optional)"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="w-full rounded-lg border hairline bg-cream/50 px-4 py-3 text-sm focus:border-signal focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-signal py-3.5 text-xs font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-ink disabled:opacity-60 shadow-sm"
          >
            {loading ? "Locating Drape…" : "Track Order Status"}
          </button>
        </div>
      </form>

      {/* Result Card */}
      {order && (
        <div className="mt-10 rounded-2xl border hairline bg-paper p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b hairline pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gold">Order Reference</span>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-ink mt-0.5">#{order.orderNumber}</h2>
              <p className="text-xs text-ink-soft mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} · {formatPrice(order.total)}
              </p>
            </div>
            <span className="rounded-full border border-forest/30 bg-forest/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-forest">
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>

          {/* Delivery Tracker */}
          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
              <Truck className="h-4 w-4" /> Fulfilment Timeline
            </h3>

            <ol className="mt-4 grid grid-cols-5 gap-1 text-center text-[10px] sm:text-xs">
              {STEPS.map((step, i) => (
                <li key={step} className="flex flex-col items-center gap-2">
                  <span className={`h-1.5 w-full rounded-full ${i <= reached ? "bg-signal" : "bg-line"}`} />
                  <span className={i <= reached ? "font-semibold text-ink" : "text-ink-soft"}>{STATUS_LABEL[step]}</span>
                </li>
              ))}
            </ol>

            {shipment?.awb ? (
              <div className="mt-6 rounded-xl border border-line bg-cream/40 p-4 text-xs sm:text-sm leading-relaxed">
                <p>
                  Courier Partner: <strong>{shipment.courierName || "Express Courier"}</strong>
                  <br />
                  Tracking Number (AWB): <strong className="font-mono text-signal">{shipment.awb}</strong>
                  {shipment.etd && (
                    <>
                      <br />
                      Estimated Delivery: <strong>{shipment.etd}</strong>
                    </>
                  )}
                </p>
                {directCourierLink && (
                  <div className="mt-3">
                    <a
                      href={directCourierLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-signal underline hover:text-ink"
                    >
                      Track directly with {shipment.courierName || "courier"} &rarr;
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-5 text-xs sm:text-sm text-ink-soft">
                Our boutique is preparing your parcel. Courier tracking will appear here once booked.
              </p>
            )}
          </div>

          {/* Delivering To & Invoice CTA */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t hairline pt-6">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-gold">Delivering To</span>
              <p className="mt-1 text-xs sm:text-sm text-ink leading-relaxed">
                <strong>{order.customer.name}</strong> ({order.customer.phone})
                <br />
                {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
              </p>
            </div>
            <div className="flex flex-col justify-center sm:items-end gap-2.5">
              <a
                href={`/api/orders/${order.id}/invoice`}
                download={`Invoice-${order.orderNumber}.pdf`}
                className="inline-flex items-center gap-2 rounded-full bg-signal px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream shadow-sm hover:bg-ink transition-colors"
              >
                <FileText className="h-4 w-4" /> Download Official Invoice (PDF)
              </a>
              <Link
                href={`/orders/${order.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-signal hover:underline"
              >
                <span>View Full Order Details</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {searched && !order && !loading && (
        <div className="mt-10 rounded-2xl border hairline bg-paper p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-gold/60" />
          <h3 className="mt-3 font-display text-lg font-bold text-ink">No Order Found</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-ink-soft leading-relaxed">
            We couldn&apos;t find an order matching &ldquo;{query}&rdquo;. Please verify your order number or contact our boutique team on WhatsApp for immediate support.
          </p>
          <div className="mt-5">
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 rounded-full border border-forest px-5 py-2 text-xs font-semibold text-forest hover:bg-forest hover:text-cream transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> Contact Customer Care
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-ink-soft">Loading order tracking…</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
