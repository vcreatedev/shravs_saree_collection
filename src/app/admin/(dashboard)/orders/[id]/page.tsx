import { notFound } from "next/navigation";
import Image from "next/image";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { CreateShipmentButton } from "@/components/admin/create-shipment-button";

export const metadata = { title: "Order Details" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">
            Order #{order.orderNumber}
          </p>
          <h1 className="font-display text-3xl italic">Order details</h1>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/orders/${order.id}/invoice`}
            className="flex items-center gap-2 rounded-full border hairline px-4 py-2 text-sm font-medium hover:border-ink"
          >
            <Download className="h-4 w-4" /> Invoice
          </a>
          <CreateShipmentButton
            orderId={order.id}
            awbCode={order.awbCode}
            courierName={order.courierName}
            trackingUrl={order.trackingUrl}
          />
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border hairline bg-paper p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
            Customer
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            {order.customerName}
            <br />
            {order.email}
            <br />
            {order.phone}
          </p>
        </div>
        <div className="rounded-2xl border hairline bg-paper p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
            Shipping address
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            {order.address}
            <br />
            {order.city}, {order.state} {order.pincode}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border hairline bg-paper p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Payment</h2>
        <p className="mt-3 text-sm leading-relaxed">
          Method: {order.paymentMethod} · Status: {order.paymentStatus}
          {order.razorpayPaymentId && (
            <>
              <br />
              Razorpay payment ID: {order.razorpayPaymentId}
            </>
          )}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border hairline bg-paper p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Items</h2>
        <ul className="mt-4 divide-y hairline">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-3">
              <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden rounded-md bg-cream">
                {item.image && (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                )}
              </div>
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-ink-soft">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 ml-auto max-w-xs space-y-1.5 border-t hairline pt-4 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
