import { formatPrice } from "./utils";
import type { OrderWithItems } from "@/types";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "our store";

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
    `*Order Confirmation - ${STORE_NAME}*`,
    `Order #${order.orderNumber}`,
    "",
    ...lines,
    "",
    `Total: ${formatPrice(order.total)}`,
    `Status: ${order.status}`,
    "",
    "Thank you for shopping with us!",
  ].join("\n");
}

export function orderStatusInquiryMessage(orderNumber: string): string {
  return `Hi! I'd like an update on my order *#${orderNumber}*.`;
}
