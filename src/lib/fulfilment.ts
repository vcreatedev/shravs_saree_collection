import "server-only";
import { getSiteSettings } from "./catalog";
import {
  sendDeliveryEmail,
  sendOrderConfirmation,
  sendOrderCancelledEmail,
  sendStoreOrderAlert,
  type DeliveryEmail,
} from "./email";
import { getOrderById, markEmailSent, updateShipment } from "./orders";
import {
  assignCourier,
  cancelShiprocketOrder,
  chooseCourier,
  createShiprocketOrder,
  generateLabel,
  generateManifest,
  getCourierQuote,
  isShiprocketConfigured,
  parcelWeight,
  schedulePickup,
  trackAwb,
  trackingUrlFor,
  type CourierQuote,
  type TrackingUpdate,
} from "./shiprocket";
import type { Order, OrderStatus } from "@/types";

/* What happens to an order after it's paid: emails, booking its courier,
   and following the parcel to the customer's door. */

/** Sends the paid order's emails - the customer's confirmation and the
 * store's alert - each at most once, and books the courier straight away if
 * Storefront Settings says to. Safe to call again for the same order. */
export async function afterPayment(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order || order.paymentStatus !== "PAID") return;
  const settings = await getSiteSettings();

  if (!order.emails?.confirmation) {
    const result = await sendOrderConfirmation(order, settings);
    if (result.sent) await markEmailSent(order.id, "confirmation");
    else console.error(`[orders] Confirmation email for ${order.orderNumber} not sent: ${result.reason}`);
  }
  if (!order.emails?.storeAlert) {
    const result = await sendStoreOrderAlert(order, settings);
    if (result.sent) await markEmailSent(order.id, "storeAlert");
    else console.error(`[orders] Store alert for ${order.orderNumber} not sent: ${result.reason}`);
  }

  if (settings.autoBookShipment && isShiprocketConfigured() && !order.shipment?.awb) {
    try {
      await bookShipment(order.id, { choice: settings.courierChoice });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[delivery] Automatic booking failed for ${order.orderNumber}: ${message}`);
      await updateShipment(order.id, { lastError: message });
    }
  }
}

/** Every courier partner that can deliver this order, with rates and dates. */
export async function quoteForOrder(order: Order): Promise<CourierQuote> {
  return getCourierQuote(order.shippingAddress.pincode, parcelWeight(order), order.subtotal);
}

/** Books the order's courier: creates it in Shiprocket (once), assigns the
 * courier given - or the one chosen by `choice` - and asks for a pickup.
 * Each step that already happened is skipped, so a failed booking can be
 * retried. */
export async function bookShipment(
  orderId: string,
  options: { courierId?: number; choice?: "recommended" | "cheapest" | "fastest" | "rated" } = {}
): Promise<Order> {
  let order = await getOrderById(orderId);
  if (!order) throw new Error("Order not found.");
  if (order.paymentStatus !== "PAID") throw new Error("Only paid orders can be shipped.");
  if (order.status === "CANCELLED") throw new Error("This order was cancelled.");

  if (!order.shipment?.shipmentId) {
    const created = await createShiprocketOrder(order);
    order = (await updateShipment(orderId, { provider: "shiprocket", ...created, lastError: "" }))!;
  }

  if (!order.shipment?.awb) {
    let courierId = options.courierId;
    if (!courierId && options.choice && options.choice !== "recommended") {
      courierId = chooseCourier(await quoteForOrder(order), options.choice)?.id;
    }
    const assigned = await assignCourier(order.shipment!.shipmentId!, courierId);
    order = (await updateShipment(
      orderId,
      {
        awb: assigned.awb,
        courierName: assigned.courierName,
        ...(assigned.courierId ? { courierId: assigned.courierId } : {}),
        trackingUrl: trackingUrlFor(assigned.awb),
        lastError: "",
      },
      { status: "READY_TO_SHIP" }
    ))!;
  }

  if (!order.shipment?.pickupScheduledFor) {
    try {
      const pickup = await schedulePickup(order.shipment!.shipmentId!);
      order = (await updateShipment(orderId, { pickupScheduledFor: pickup.scheduledFor || new Date().toISOString() }))!;
    } catch (error) {
      // The courier is booked; the pickup can be requested again from the Studio.
      order = (await updateShipment(orderId, {
        lastError: `Courier booked, but the pickup request failed: ${error instanceof Error ? error.message : error}`,
      }))!;
    }
  }
  return order;
}

export async function labelForOrder(orderId: string): Promise<string> {
  const order = await getOrderById(orderId);
  if (!order?.shipment?.shipmentId || !order.shipment.awb) throw new Error("Book a courier for this order first.");
  const url = await generateLabel(order.shipment.shipmentId);
  await updateShipment(orderId, { labelUrl: url });
  return url;
}

export async function manifestForOrder(orderId: string): Promise<string> {
  const order = await getOrderById(orderId);
  if (!order?.shipment?.shipmentId || !order.shipment.awb) throw new Error("Book a courier for this order first.");
  const url = await generateManifest(order.shipment.shipmentId);
  await updateShipment(orderId, { manifestUrl: url });
  return url;
}

export async function pickupForOrder(orderId: string): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order?.shipment?.shipmentId || !order.shipment.awb) throw new Error("Book a courier for this order first.");
  const pickup = await schedulePickup(order.shipment.shipmentId);
  return (await updateShipment(orderId, { pickupScheduledFor: pickup.scheduledFor || new Date().toISOString(), lastError: "" }))!;
}

/** Cancels the shipment in Shiprocket (before pickup) so the order can be
 * booked again, e.g. with another courier. */
export async function cancelShipment(orderId: string): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order?.shipment?.srOrderId) throw new Error("This order has no shipment to cancel.");
  await cancelShiprocketOrder(order.shipment.srOrderId);
  return (await updateShipment(
    orderId,
    {
      srOrderId: "",
      shipmentId: "",
      awb: "",
      courierName: "",
      labelUrl: "",
      manifestUrl: "",
      pickupScheduledFor: "",
      trackingUrl: "",
      status: "CANCELLED",
      lastError: "",
    },
    { status: "CONFIRMED" }
  ))!;
}

/* ── Tracking ── */

/** Order status for a courier's status wording. Unknown wording returns
 * null: the order status is then left as it is. */
export function statusForCourier(courierStatus: string): OrderStatus | null {
  const s = courierStatus.toUpperCase();
  if (s.includes("RTO") || s.includes("RETURN")) return "RETURNED";
  if (s.includes("UNDELIVERED") || s.includes("NOT DELIVERED")) return "SHIPPED";
  if (s.includes("OUT FOR DELIVERY")) return "OUT_FOR_DELIVERY";
  if (s.includes("DELIVERED")) return "DELIVERED";
  if (s.includes("OUT FOR PICKUP") || s.includes("PICKUP") || s.includes("MANIFEST") || s.includes("AWB")) return "READY_TO_SHIP";
  if (
    s.includes("PICKED UP") ||
    s.includes("SHIPPED") ||
    s.includes("IN TRANSIT") ||
    s.includes("REACHED") ||
    s.includes("DESTINATION") ||
    s.includes("HUB") ||
    s.includes("DELAYED")
  ) {
    return "SHIPPED";
  }
  return null;
}

/* How far along each status is: an update never moves an order back (a late
   "in transit" after "delivered"), except into RETURNED. */
const PROGRESS: Record<OrderStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  READY_TO_SHIP: 2,
  SHIPPED: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  RETURNED: 6,
  CANCELLED: 7,
};

const EMAIL_FOR: Partial<Record<OrderStatus, DeliveryEmail>> = {
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "outForDelivery",
  DELIVERED: "delivered",
};

/** Saves a tracking update on its order and emails the customer when the
 * parcel ships, goes out for delivery and arrives - each email once. */
export async function applyTrackingUpdate(order: Order, update: TrackingUpdate): Promise<Order> {
  const next = statusForCourier(update.status);
  const status =
    next && order.status !== "CANCELLED" && (next === "RETURNED" || PROGRESS[next] > PROGRESS[order.status]) ? next : undefined;

  const saved = (await updateShipment(
    order.id,
    {
      ...(update.status ? { status: update.status } : {}),
      ...(update.etd ? { etd: update.etd } : {}),
      ...(update.courierName ? { courierName: update.courierName } : {}),
      trackingUrl: update.trackingUrl,
    },
    { events: update.scans, status }
  ))!;

  // The customer hears that it shipped (even if the update jumped straight to
  // out for delivery), then about the stage it's at now - each email once.
  const due: DeliveryEmail[] = [];
  if (saved.status !== "RETURNED" && PROGRESS[saved.status] >= PROGRESS.SHIPPED) due.push("shipped");
  const current = EMAIL_FOR[saved.status];
  if (current && current !== "shipped") due.push(current);

  const settings = await getSiteSettings();
  for (const kind of due) {
    if (saved.emails?.[kind]) continue;
    const result = await sendDeliveryEmail(saved, kind, settings);
    if (result.sent) await markEmailSent(saved.id, kind);
    else console.error(`[delivery] ${kind} email for ${saved.orderNumber} not sent: ${result.reason}`);
  }
  return (await getOrderById(order.id))!;
}

/** Sets an order's status by hand from the Studio, emailing the customer
 * when that's a delivery stage they haven't heard about yet. */
export async function setOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const order = await updateShipment(orderId, {}, { status });
  if (!order) throw new Error("Order not found.");
  const settings = await getSiteSettings();

  if (status === "CANCELLED" && !order.emails?.cancellation) {
    const result = await sendOrderCancelledEmail(order, settings);
    if (result.sent) await markEmailSent(order.id, "cancellation");
  }

  const kind = EMAIL_FOR[status];
  if (kind && !order.emails?.[kind]) {
    const result = await sendDeliveryEmail(order, kind, settings);
    if (result.sent) await markEmailSent(order.id, kind);
  }
  return (await getOrderById(orderId))!;
}

/** Records a parcel sent outside Shiprocket (e.g. India Post, a local
 * courier): its courier and tracking number, marking the order shipped and
 * emailing the customer. */
export async function recordManualShipment(
  orderId: string,
  details: { courierName: string; awb: string; trackingUrl?: string }
): Promise<Order> {
  await updateShipment(orderId, {
    provider: "manual",
    courierName: details.courierName,
    awb: details.awb,
    trackingUrl: details.trackingUrl ?? "",
    lastError: "",
  });
  return setOrderStatus(orderId, "SHIPPED");
}

/** Asks the courier where the order's parcel is now and saves the answer. */
export async function refreshTracking(orderId: string): Promise<Order> {
  const order = await getOrderById(orderId);
  if (!order?.shipment?.awb) throw new Error("This order has no tracking number yet.");
  return applyTrackingUpdate(order, await trackAwb(order.shipment.awb));
}
