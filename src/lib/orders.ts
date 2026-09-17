import { prisma } from "./prisma";
import {
  generateOrderNumber,
  parseSizeStock,
  parseColorVariants,
  parseImages,
  effectivePrice,
  imagesForColor,
  nameForColor,
  sizeStockForColor,
} from "./utils";
import type { CartLine, CheckoutAddress } from "@/types";

export const SHIPPING_FEE = 99;
export const FREE_SHIPPING_THRESHOLD = 2000;

export function computeShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export class OrderValidationError extends Error {}

type StockableProduct = { stock: number; sizeStock: unknown; colorVariants: unknown };

function availableStockFor(product: StockableProduct, color?: string | null, size?: string | null): number {
  const variants = parseColorVariants(product.colorVariants);
  const baseSizeStock = parseSizeStock(product.sizeStock);
  const stockMap = sizeStockForColor(baseSizeStock, variants, color ?? undefined);
  if (size && Object.keys(stockMap).length > 0) {
    return stockMap[size] ?? 0;
  }
  return product.stock;
}

/** Prisma `data` patch to decrement stock for one order line, writing to the
 * color variant's own size-stock if it has an override, else the base product. */
function buildStockDecrementData(product: StockableProduct, color: string | null, size: string | null, quantity: number) {
  const variants = parseColorVariants(product.colorVariants);
  const baseSizeStock = parseSizeStock(product.sizeStock);
  const currentSizeStock = sizeStockForColor(baseSizeStock, variants, color ?? undefined);

  if (!size || Object.keys(currentSizeStock).length === 0) {
    return { stock: { decrement: quantity } };
  }

  const nextSizeStock = {
    ...currentSizeStock,
    [size]: Math.max(0, (currentSizeStock[size] ?? 0) - quantity),
  };

  const variant = color ? variants.find((v) => v.color === color) : undefined;
  if (variant && variant.sizeStock !== null) {
    const nextVariants = variants.map((v) => (v.color === color ? { ...v, sizeStock: nextSizeStock } : v));
    return { colorVariants: nextVariants, stock: { decrement: quantity } };
  }

  return { sizeStock: nextSizeStock, stock: { decrement: quantity } };
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
    const available = availableStockFor(product, line.color, line.size);
    if (available < line.quantity) {
      const sizeNote = line.size ? ` in size ${line.size}` : "";
      throw new OrderValidationError(`Only ${available} left in stock for ${product.name}${sizeNote}.`);
    }
    const variants = parseColorVariants(product.colorVariants);
    const price = effectivePrice(product.price, variants, line.color);
    subtotal += price * line.quantity;
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
          const variants = parseColorVariants(product.colorVariants);
          const baseImages = parseImages(product.images);
          const image = imagesForColor(baseImages, variants, line.color)[0] ?? line.image;
          return {
            productId: product.id,
            name: nameForColor(product.name, variants, line.color),
            image,
            price: effectivePrice(product.price, variants, line.color),
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
            if (!product) return Promise.resolve();
            const data = buildStockDecrementData(product, item.color, item.size, item.quantity);
            return tx.product.update({ where: { id: item.productId! }, data });
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
