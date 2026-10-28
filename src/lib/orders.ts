import "server-only";
import { randomUUID } from "crypto";
import { writeClient } from "@/sanity/write-client";
import { generateOrderNumber } from "./utils";
import { getSiteSettings } from "./catalog";
import type { CartLine, CheckoutAddress, Order, OrderLine, OrderStatus, Shipment, ShipmentEvent } from "@/types";

/* Orders are private Sanity documents, id "orders.<id>": Sanity never lets
   anyone without a login or token read a document whose id has a dot, so
   they stay private although the dataset is public. The site reads and
   writes them with SANITY_API_WRITE_TOKEN; the Studio's Orders tool with the
   editor's own login. */

export class OrderValidationError extends Error {}

const docId = (id: string) => `orders.${id}`;

const ORDER_PROJECTION = `{
  ...,
  "id": string::split(_id, "orders.")[1]
}`;

export function computeShipping(subtotal: number, fee: number, freeFrom: number): number {
  return subtotal >= freeFrom ? 0 : fee;
}

type ProductForOrder = {
  _id: string;
  title: string;
  slug: string;
  productCode: string | null;
  price: number;
  inStock: boolean | null;
  stockQuantity: number | null;
  weightKg: number | null;
  image: string | null;
  sizes: { _key: string; size: string; stockQuantity: number | null }[] | null;
  variants: { name: string; image: string | null; inStock: boolean | null }[] | null;
};

/** Pieces of a product that can be bought: per size when it has sizes. */
function availableFor(product: ProductForOrder, size?: string): number {
  if (product.inStock === false) return 0;
  const sizes = product.sizes ?? [];
  if (sizes.length > 0) {
    const match = sizes.find((s) => s.size === size);
    return Math.max(0, match?.stockQuantity ?? 0);
  }
  return Math.max(0, product.stockQuantity ?? 0);
}

/** Prices the bag from Sanity's published products - never from what the
 * browser sent - checks stock, and saves the order as PENDING until paid. */
export async function createPendingOrder(lines: CartLine[], address: CheckoutAddress): Promise<Order> {
  if (lines.length === 0) throw new OrderValidationError("Your bag is empty.");

  const ids = [...new Set(lines.map((l) => l.productId))];
  const products = await writeClient.fetch<ProductForOrder[]>(
    `*[_type == "product" && _id in $ids]{
      _id, title, "slug": slug.current, productCode, price, inStock, stockQuantity, weightKg,
      "image": images[0].asset->url,
      sizes[]{ _key, size, stockQuantity },
      variants[]{ name, "image": image.asset->url, inStock }
    }`,
    { ids }
  );
  const byId = new Map(products.map((p) => [p._id, p]));

  const items: (OrderLine & { sizeKey?: string })[] = lines.map((line, i) => {
    const product = byId.get(line.productId);
    if (!product) throw new OrderValidationError(`${line.name} is no longer available.`);
    const available = availableFor(product, line.size);
    if (available < line.quantity) {
      const sizeNote = line.size ? ` in size ${line.size}` : "";
      throw new OrderValidationError(
        available === 0
          ? `${product.title}${sizeNote} has just sold out.`
          : `Only ${available} left of ${product.title}${sizeNote}.`
      );
    }
    const variant = line.color ? product.variants?.find((v) => v.name === line.color) : undefined;
    if (variant && variant.inStock === false) {
      throw new OrderValidationError(`${product.title} in ${variant.name} has just sold out.`);
    }
    const sizeKey = line.size ? product.sizes?.find((s) => s.size === line.size)?._key : undefined;
    return {
      _key: `line${i}`,
      productId: product._id,
      slug: product.slug,
      code: product.productCode ?? "",
      name: product.title,
      image: variant?.image || product.image || "",
      price: product.price,
      quantity: line.quantity,
      ...(line.color ? { color: line.color } : {}),
      ...(line.size ? { size: line.size } : {}),
      ...(sizeKey ? { sizeKey } : {}),
      weightKg: product.weightKg ?? 0.5,
    };
  });

  const settings = await getSiteSettings();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = computeShipping(subtotal, settings.shippingFee, settings.freeShippingThreshold);
  const now = new Date().toISOString();
  const id = randomUUID();

  const doc = {
    _id: docId(id),
    _type: "order",
    orderNumber: generateOrderNumber(),
    status: "PENDING" as const,
    paymentStatus: "PENDING" as const,
    customer: {
      name: address.customerName.trim(),
      email: address.email.trim().toLowerCase(),
      phone: address.phone.trim(),
      /* digits only, so My Orders finds the order however the number is typed */
      phoneDigits: address.phone.replace(/\D/g, "").slice(-10),
    },
    shippingAddress: {
      address: address.address.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      pincode: address.pincode.trim(),
    },
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    payment: { provider: "razorpay" as const },
    stockDeducted: false,
    createdAt: now,
    updatedAt: now,
  };
  await writeClient.create(doc);
  return { ...doc, id } as Order;
}

export async function attachRazorpayOrder(id: string, razorpayOrderId: string) {
  await writeClient
    .patch(docId(id))
    .set({ "payment.razorpayOrderId": razorpayOrderId, updatedAt: new Date().toISOString() })
    .commit();
}

export function getOrderById(id: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Promise.resolve(null);
  return writeClient.fetch<Order | null>(`*[_id == $id][0] ${ORDER_PROJECTION}`, { id: docId(id) });
}

export function getOrderByRazorpayOrderId(razorpayOrderId: string): Promise<Order | null> {
  return writeClient.fetch<Order | null>(
    `*[_type == "order" && _id in path("orders.*") && payment.razorpayOrderId == $rid][0] ${ORDER_PROJECTION}`,
    { rid: razorpayOrderId }
  );
}

/** A shopper's orders, found by the email and phone number they checked out
 * with - both must match. Unpaid and failed checkouts are left out. */
export function findOrdersByContact(email: string, phone: string): Promise<Order[]> {
  return writeClient.fetch<Order[]>(
    `*[_type == "order" && _id in path("orders.*") && paymentStatus in ["PAID", "REFUNDED"]
        && customer.email == $email && customer.phoneDigits == $digits] | order(createdAt desc) ${ORDER_PROJECTION}`,
    { email: email.trim().toLowerCase(), digits: phone.replace(/\D/g, "").slice(-10) }
  );
}

export function findOrderByNumberAndEmail(orderNumber: string, email: string): Promise<Order | null> {
  const cleanNum = orderNumber.trim().replace(/^#/, "").toUpperCase();
  return writeClient.fetch<Order | null>(
    `*[_type == "order" && _id in path("orders.*") && orderNumber == $number && customer.email == $email][0] ${ORDER_PROJECTION}`,
    { number: cleanNum, email: email.trim().toLowerCase() }
  );
}

/** Finds an order by its Order Number, Razorpay Order ID, Razorpay Payment ID,
 * Tracking Number (AWB), Email or Phone Number (like VSN Vastraa). */
export function findOrderFlexible(query: string, emailOrPhone?: string): Promise<Order | null> {
  const q = String(query || "").trim();
  if (!q) return Promise.resolve(null);
  const qClean = q.replace(/^#/, "");
  const qUpper = qClean.toUpperCase();
  const qLower = qClean.toLowerCase();
  const digits = q.replace(/\D/g, "");
  const ep = (emailOrPhone || "").trim().toLowerCase();
  const epDigits = ep.replace(/\D/g, "").slice(-10);

  if (ep) {
    return writeClient.fetch<Order | null>(
      `*[_type == "order" && _id in path("orders.*") && (
        orderNumber == $qUpper || lower(payment.razorpayOrderId) == $qLower ||
        lower(payment.razorpayPaymentId) == $qLower || lower(shipment.awb) == $qLower
      ) && (
        lower(customer.email) == $ep || (length($epDigits) >= 10 && customer.phoneDigits == $epDigits)
      )][0] ${ORDER_PROJECTION}`,
      { qUpper, qLower, ep, epDigits }
    );
  }

  return writeClient.fetch<Order | null>(
    `*[_type == "order" && _id in path("orders.*") && (
      orderNumber == $qUpper || lower(payment.razorpayOrderId) == $qLower ||
      lower(payment.razorpayPaymentId) == $qLower || lower(shipment.awb) == $qLower ||
      lower(customer.email) == $qLower || (length($digits) >= 10 && customer.phoneDigits == $digits)
    )] | order(createdAt desc)[0] ${ORDER_PROJECTION}`,
    { qUpper, qLower, digits }
  );
}

/** Marks a PENDING order paid and takes its pieces out of stock, as one
 * Sanity transaction. The browser's confirmation and Razorpay's webhook can
 * both report the same payment, so it runs once: the order is changed only
 * if no one else changed it since it was read (ifRevisionId), and a paid
 * order is returned as it is. Returns the order and whether this call paid it. */
export async function confirmOrderPayment(
  razorpayOrderId: string,
  payment: { razorpayPaymentId: string; method?: string }
): Promise<{ order: Order; justPaid: boolean } | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const order = await getOrderByRazorpayOrderId(razorpayOrderId);
    if (!order) return null;
    if (order.paymentStatus === "PAID") return { order, justPaid: false };

    const now = new Date().toISOString();
    const tx = writeClient.transaction().patch(
      writeClient
        .patch(order._id)
        .ifRevisionId((order as Order & { _rev: string })._rev)
        .set({
          status: "CONFIRMED",
          paymentStatus: "PAID",
          "payment.razorpayPaymentId": payment.razorpayPaymentId,
          ...(payment.method ? { "payment.method": payment.method } : {}),
          "payment.paidAt": now,
          stockDeducted: true,
          updatedAt: now,
        })
    );

    // Take the pieces out of stock on the published product, and on its
    // unpublished draft too if there is one, so publishing the draft later
    // doesn't put the old count back.
    const productIds = [...new Set(order.items.map((i) => i.productId))];
    const existingDrafts = new Set(
      await writeClient.fetch<string[]>(`*[_id in $ids]._id`, { ids: productIds.map((p) => `drafts.${p}`) })
    );
    for (const item of order.items as (OrderLine & { sizeKey?: string })[]) {
      const field = item.sizeKey ? `sizes[_key=="${item.sizeKey}"].stockQuantity` : "stockQuantity";
      for (const target of [item.productId, `drafts.${item.productId}`]) {
        if (target.startsWith("drafts.") && !existingDrafts.has(target)) continue;
        tx.patch(target, (p) => p.setIfMissing({ [field]: 0 }).dec({ [field]: item.quantity }));
      }
    }

    try {
      await tx.commit();
      const paid = await getOrderById(order.id);
      return paid ? { order: paid, justPaid: true } : null;
    } catch (error) {
      // Someone else changed the order between reading and writing it - read
      // it again: usually the other report has just marked it paid.
      if ((error as { statusCode?: number }).statusCode === 409) continue;
      throw error;
    }
  }
  throw new Error(`Could not confirm payment for ${razorpayOrderId} after 3 attempts.`);
}

export async function updateOrder(id: string, set: Record<string, unknown>) {
  await writeClient
    .patch(docId(id))
    .set({ ...set, updatedAt: new Date().toISOString() })
    .commit();
}

export async function markEmailSent(id: string, kind: keyof NonNullable<Order["emails"]>) {
  await updateOrder(id, { [`emails.${kind}`]: new Date().toISOString() });
}

/** Saves a shipment change: the fields given, any new tracking events (an
 * event already recorded is never added twice), and the order status. */
export async function updateShipment(
  id: string,
  shipment: Partial<Shipment>,
  options: { events?: Omit<ShipmentEvent, "_key">[]; status?: OrderStatus } = {}
) {
  const order = await getOrderById(id);
  if (!order) return null;
  const seen = new Set((order.shipment?.history ?? []).map((e) => `${e.date}|${e.activity}`));
  const fresh = (options.events ?? [])
    .filter((e) => !seen.has(`${e.date}|${e.activity}`))
    .map((e) => ({ ...e, _key: randomUUID().slice(0, 12) }));
  const now = new Date().toISOString();

  const patch = writeClient
    .patch(order._id)
    .setIfMissing({ shipment: { provider: "shiprocket" } })
    .set({
      ...Object.fromEntries(Object.entries(shipment).map(([k, v]) => [`shipment.${k}`, v])),
      "shipment.updatedAt": now,
      ...(options.status ? { status: options.status } : {}),
      updatedAt: now,
    });
  if (fresh.length > 0) {
    patch.setIfMissing({ "shipment.history": [] }).append("shipment.history", fresh);
  }
  await patch.commit();
  return getOrderById(id);
}

/** The order whose shipment has this AWB (tracking) number. */
export function getOrderByAwb(awb: string): Promise<Order | null> {
  return writeClient.fetch<Order | null>(
    `*[_type == "order" && _id in path("orders.*") && shipment.awb == $awb][0] ${ORDER_PROJECTION}`,
    { awb }
  );
}
