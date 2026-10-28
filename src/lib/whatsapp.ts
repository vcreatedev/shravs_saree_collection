import { formatPrice } from "./utils";
import type { Order } from "@/types";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

/** A link that opens a WhatsApp chat with the store, message pre-filled. */
export function buildWhatsAppLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function generalInquiryMessage(storeName: string): string {
  return `Hi ${storeName}! I'd like to know more about your products.`;
}

export function productInquiryMessage(productName: string, url: string): string {
  return `Hi! I'm interested in *${productName}*.\n${url}\n\nIs it currently in stock?`;
}

/** The order's details, for the customer to send to the store on WhatsApp. */
export function orderShareMessage(order: Order, storeName: string): string {
  const lines = order.items.map((item) => `• ${item.name} x${item.quantity} — ${formatPrice(item.price * item.quantity)}`);
  return [
    `*New Order - ${storeName}*`,
    `Order #${order.orderNumber}`,
    `Customer: ${order.customer.name} (${order.customer.phone})`,
    "",
    ...lines,
    "",
    `Total: ${formatPrice(order.total)}`,
    `Payment: Razorpay - ${order.paymentStatus}`,
    ...(SITE_URL ? ["", `Order: ${SITE_URL}/orders/${order.id}`] : []),
  ].join("\n");
}

export function orderStatusInquiryMessage(orderNumber: string): string {
  return `Hi! I'd like an update on my order *#${orderNumber}*.`;
}
