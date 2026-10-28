import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Truck, FileText, ArrowRight } from "lucide-react";
import { getOrderById } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import { getSiteSettings } from "@/lib/catalog";
import { OrderActions } from "@/components/order-actions";
import { PostPurchaseActions } from "@/components/post-purchase-actions";
import { STATUS_LABEL } from "@/lib/order-status";
import type { OrderStatus } from "@/types";

export const dynamic = "force-dynamic";

// The delivery journey, in order - an order's status lights up every step up to its own.
const STEPS: OrderStatus[] = ["CONFIRMED", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default async function OrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const [order, settings] = await Promise.all([getOrderById(id), getSiteSettings()]);

  if (!order || order.paymentStatus === "PENDING") notFound();

  const shipment = order.shipment;
  const reached = STEPS.indexOf(order.status);
  const history = [...(shipment?.history ?? [])].reverse();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      {isNew && <PostPurchaseActions order={order} />}

      {/* Official Retail Invoice Banner (Matching VSN Vastraa) */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-gold/40 bg-paper p-6 sm:p-8 text-center shadow-sm">
        {settings.logo && (
          <div className="mb-4 flex justify-center">
            <span className="relative block h-16 w-16 overflow-hidden rounded-full ring-2 ring-gold/70 shadow-md">
              <Image src={settings.logo} alt={settings.storeName} fill sizes="64px" className="object-cover" />
            </span>
          </div>
        )}

        <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full bg-forest/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-forest border border-forest/20">
          <CheckCircle2 className="h-4 w-4" />
          {isNew ? "Order Placed with Love · Payment Confirmed" : "Official Retail Invoice Generated"}
        </div>

        <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink">
          {isNew ? "Thank You for Your Order!" : `Order #${order.orderNumber}`}
        </h1>
        <p className="mt-1 text-sm font-medium text-ink-soft">
          Payment Confirmed & Verified · {formatPrice(order.total)}
        </p>

        <div className="mx-auto mt-4 max-w-xl rounded-xl border border-line bg-cream/60 p-4 text-xs sm:text-sm leading-relaxed text-ink-soft">
          <div className="flex items-center justify-center gap-1.5 font-semibold text-ink mb-1">
            <FileText className="h-4 w-4 text-signal" />
            <span>Official Invoice Generated</span>
          </div>
          Your official purchase invoice with itemized line items and boutique verification seal has been generated and dispatched to{" "}
          <strong className="text-ink">{order.customer.email}</strong> along with your order confirmation.
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={`/api/orders/${order.id}/invoice`}
            download={`Invoice-${order.orderNumber}.pdf`}
            className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-xs font-semibold uppercase tracking-wider text-cream shadow transition-colors hover:bg-ink"
          >
            <span>⬇ Download Invoice (PDF)</span>
          </a>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-paper px-6 py-3 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-gold/10"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Order Reference Card */}
      <div className="mb-8 rounded-xl border hairline bg-paper p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b hairline">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gold">Order Reference</span>
            <strong className="font-mono text-sm sm:text-base text-ink">#{order.orderNumber}</strong>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gold">Razorpay Payment ID</span>
            <strong className="font-mono text-sm sm:text-base text-signal">
              {order.payment.razorpayPaymentId || "Verified Online"}
            </strong>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gold">Delivering To</span>
            <p className="mt-1 text-xs sm:text-sm text-ink leading-relaxed">
              <strong>{order.customer.name}</strong> ({order.customer.phone})
              <br />
              {order.customer.email}
              <br />
              {order.shippingAddress.address}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}
            </p>
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-gold">Boutique Atelier Note</span>
            <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">
              Your payment has been securely verified via Razorpay. Our boutique is preparing your handpicked heirloom drape with utmost care for insured dispatch.
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Tracking Journey */}
      {order.status !== "CANCELLED" && order.status !== "RETURNED" && (
        <section className="mt-8 rounded-xl border hairline bg-paper p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Truck className="h-4 w-4 text-gold" strokeWidth={1.75} /> Delivery Journey
            </h2>
            <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-semibold text-ink">
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>

          <ol className="mt-5 grid grid-cols-5 gap-1 text-center text-[10px] sm:text-xs">
            {STEPS.map((step, i) => (
              <li key={step} className="flex flex-col items-center gap-2">
                <span className={`h-1.5 w-full rounded-full transition-colors ${i <= reached ? "bg-signal" : "bg-line"}`} />
                <span className={i <= reached ? "font-semibold text-ink" : "text-ink-soft"}>{STATUS_LABEL[step]}</span>
              </li>
            ))}
          </ol>

          {shipment?.awb ? (
            <div className="mt-6 rounded-lg border border-line bg-cream/40 p-4 text-xs sm:text-sm leading-relaxed">
              <p>
                Courier Partner: <strong>{shipment.courierName || "Express Courier"}</strong>
                <br />
                Tracking Number (AWB): <strong className="font-mono text-signal">{shipment.awb}</strong>
                {shipment.etd && order.status !== "DELIVERED" && (
                  <>
                    <br />
                    Expected Delivery: <strong>{shipment.etd}</strong>
                  </>
                )}
              </p>
              {shipment.trackingUrl && (
                <div className="mt-3">
                  <a
                    href={shipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-signal underline hover:text-ink"
                  >
                    Track parcel with courier partner &rarr;
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-5 text-xs sm:text-sm text-ink-soft">
              We&apos;re preparing your order. Its courier and tracking number will appear here, and in an email, once it
              ships.
            </p>
          )}

          {history.length > 0 && (
            <ul className="mt-5 space-y-3 border-l-2 border-line pl-4 text-xs">
              {history.slice(0, 12).map((event) => (
                <li key={event._key}>
                  <p className="font-medium text-ink">{event.activity || event.status}</p>
                  <p className="text-ink-soft">
                    {[event.location, event.date].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Ordered Items List */}
      <div className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Ordered Drapes</h2>
        <ul className="mt-4 divide-y hairline border-y hairline">
          {order.items.map((item) => (
            <li key={item._key} className="flex gap-4 py-4">
              <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-md bg-cream border hairline">
                {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />}
              </div>
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-ink-soft">
                    {item.code && <span className="font-mono text-signal font-semibold">CODE: {item.code}</span>}
                    {(item.color || item.size) && (
                      <span>{[item.color, item.size].filter(Boolean).join(" / ")}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-ink">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>Insured Shipping</span>
            <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between border-t hairline pt-2 text-lg font-semibold text-ink">
            <span>Total Paid</span>
            <span className="text-signal">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <OrderActions order={order} />
      </div>
    </div>
  );
}
