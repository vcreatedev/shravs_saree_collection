import { notFound } from "next/navigation";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { OrderActions } from "@/components/order-actions";
import { PostPurchaseActions } from "@/components/post-purchase-actions";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending payment",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function OrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      {isNew && <PostPurchaseActions order={order} />}
      {isNew && (
        <div className="mb-8 flex items-center gap-3 rounded-xl bg-forest/10 px-5 py-4 text-forest">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Order placed successfully! Your invoice is downloading now, and we&apos;ve opened
            WhatsApp with your order summary ready to send — just hit send. (If your browser
            blocked either of those, use the buttons below.)
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 border-b hairline pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
            Order #{order.orderNumber}
          </p>
          <h1 className="mt-1 font-display text-3xl italic">Order details</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="rounded-full border hairline px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
            Shipping to
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            {order.customerName}
            <br />
            {order.address}
            <br />
            {order.city}, {order.state} {order.pincode}
            <br />
            {order.phone}
          </p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
            Payment
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            Method: {order.paymentMethod}
            <br />
            Status: {order.paymentStatus}
            {order.razorpayPaymentId && (
              <>
                <br />
                Reference: {order.razorpayPaymentId}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Items</h2>
        <ul className="mt-4 divide-y hairline border-y hairline">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-md bg-cream">
                {item.image && (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                )}
              </div>
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  {(item.color || item.size) && (
                    <p className="text-xs text-ink-soft">
                      {[item.color, item.size].filter(Boolean).join(" / ")}
                    </p>
                  )}
                  <p className="text-xs text-ink-soft">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
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
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between border-t hairline pt-2 font-display text-lg">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <OrderActions order={order} />
      </div>
    </div>
  );
}
