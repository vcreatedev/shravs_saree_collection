import { formatPrice } from "./utils";
import type { OrderWithItems } from "@/types";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "our store";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export function buildWhatsAppLink(message: string, number: string = WHATSAPP_NUMBER): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}

export function generalInquiryMessage(): string {
  return `Hi ${STORE_NAME}! I'd like to know more about your products.`;
}

export function productInquiryMessage(productName: string, url: string): string {
  return `Hi! I'm interested in *${productName}*.\n${url}\n\nIs it currently in stock?`;
}

export function orderShareMessage(order: OrderWithItems): string {
  const lines = order.items.map(
    (item) => `• ${item.name} x${item.quantity} — ${formatPrice(item.price * item.quantity)}`
  );
  return [
    `*New Order - ${STORE_NAME}*`,
    `Order #${order.orderNumber}`,
    `Customer: ${order.customerName} (${order.phone})`,
    "",
    ...lines,
    "",
    `Total: ${formatPrice(order.total)}`,
    `Payment: ${order.paymentMethod} - ${order.paymentStatus}`,
    "",
    `Invoice: ${SITE_URL}/api/orders/${order.id}/invoice`,
  ].join("\n");
}

export function orderStatusInquiryMessage(orderNumber: string): string {
  return `Hi! I'd like an update on my order *#${orderNumber}*.`;
}
