import { prisma } from "./prisma";
import { generateOrderNumber } from "./utils";
import type { CartLine, CheckoutAddress } from "@/types";

export const SHIPPING_FEE = 99;
export const FREE_SHIPPING_THRESHOLD = 2000;

export function computeShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export class OrderValidationError extends Error {}

export async function createPendingOrder(items: CartLine[], address: CheckoutAddress) {
  if (!items.length) throw new OrderValidationError("Your bag is empty.");

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  for (const line of items) {
    const product = productMap.get(line.productId);
    if (!product) throw new OrderValidationError(`Product no longer available: ${line.name}`);
    if (product.stock < line.quantity) {
      throw new OrderValidationError(`Only ${product.stock} left in stock for ${product.name}.`);
    }
    subtotal += product.price * line.quantity;
  }

  const shipping = computeShipping(subtotal);
  const total = subtotal + shipping;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      customerName: address.customerName,
      email: address.email.trim().toLowerCase(),
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      subtotal,
      shipping,
      total,
      items: {
        create: items.map((line) => {
          const product = productMap.get(line.productId)!;
          return {
            productId: product.id,
            name: product.name,
            image: line.image,
            price: product.price,
            quantity: line.quantity,
            color: line.color,
            size: line.size,
          };
        }),
      },
    },
    include: { items: true },
  });

  return order;
}

export async function markOrderConfirmed(
  orderId: string,
  paymentStatus: string,
  extra: { razorpayOrderId?: string; razorpayPaymentId?: string } = {}
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });

    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        paymentStatus,
        razorpayOrderId: extra.razorpayOrderId,
        razorpayPaymentId: extra.razorpayPaymentId,
      },
      include: { items: true },
    });
  });
}
