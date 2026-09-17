import { prisma } from "./prisma";
import { generateOrderNumber, parseSizeStock } from "./utils";
import type { CartLine, CheckoutAddress } from "@/types";

export const SHIPPING_FEE = 99;
export const FREE_SHIPPING_THRESHOLD = 2000;

export function computeShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export class OrderValidationError extends Error {}

function availableStockFor(product: { stock: number; sizeStock: unknown }, size?: string | null): number {
  const sizeStock = parseSizeStock(product.sizeStock);
  if (size && Object.keys(sizeStock).length > 0) {
    return sizeStock[size] ?? 0;
  }
  return product.stock;
}

export async function createPendingOrder(items: CartLine[], address: CheckoutAddress, paymentMethod: "RAZORPAY") {
  if (!items.length) throw new OrderValidationError("Your bag is empty.");

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  for (const line of items) {
    const product = productMap.get(line.productId);
    if (!product) throw new OrderValidationError(`Product no longer available: ${line.name}`);
    const available = availableStockFor(product, line.size);
    if (available < line.quantity) {
      const sizeNote = line.size ? ` in size ${line.size}` : "";
      throw new OrderValidationError(`Only ${available} left in stock for ${product.name}${sizeNote}.`);
    }
    subtotal += product.price * line.quantity;
  }

  const shipping = computeShipping(subtotal);
  const total = subtotal + shipping;

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      paymentMethod,
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
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });

      const productIds = order.items.map((i) => i.productId).filter((id): id is string => Boolean(id));
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(products.map((p) => [p.id, p]));

      await Promise.all(
        order.items
          .filter((item) => item.productId)
          .map((item) => {
            const product = productMap.get(item.productId!);
            const sizeStock = product ? parseSizeStock(product.sizeStock) : {};

            if (item.size && Object.keys(sizeStock).length > 0) {
              const nextSizeStock = {
                ...sizeStock,
                [item.size]: Math.max(0, (sizeStock[item.size] ?? 0) - item.quantity),
              };
              return tx.product.update({
                where: { id: item.productId! },
                data: {
                  sizeStock: nextSizeStock,
                  stock: { decrement: item.quantity },
                },
              });
            }

            return tx.product.update({
              where: { id: item.productId! },
              data: { stock: { decrement: item.quantity } },
            });
          })
      );

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
    },
    { timeout: 15000 }
  );
}
