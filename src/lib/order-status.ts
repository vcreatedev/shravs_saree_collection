import type { OrderStatus } from "@/types";

/** How each order status reads to shoppers and in the Studio. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending payment",
  CONFIRMED: "Confirmed",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};
