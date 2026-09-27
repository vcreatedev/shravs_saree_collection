import type { Order, OrderItem } from "@prisma/client";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// No per-product dimensions exist in the catalog - a single reasonable
// default for a clothing/saree parcel, used for every shipment until the
// catalog tracks real package dimensions.
const DEFAULT_PACKAGE = { length: 30, breadth: 25, height: 5, weight: 0.5 };

export class ShiprocketConfigError extends Error {}
export class ShiprocketApiError extends Error {}

let cachedToken: { token: string; expiresAt: number } | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ShiprocketConfigError(
      `Shiprocket isn't configured yet - set ${name} in .env to enable shipment creation.`
    );
  }
  return value;
}

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const email = requireEnv("SHIPROCKET_EMAIL");
  const password = requireEnv("SHIPROCKET_PASSWORD");

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new ShiprocketApiError(`Shiprocket login failed (${res.status}).`);
  }
  const data = await res.json();
  if (!data.token) {
    throw new ShiprocketApiError("Shiprocket login response had no token.");
  }

  // Tokens last ~10 days - cached a little short of that so a near-expiry
  // token is never reused mid-request.
  cachedToken = { token: data.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return cachedToken.token;
}

async function shiprocketRequest(path: string, body: unknown) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.message === "string" ? data.message : `request to ${path} failed (${res.status})`;
    throw new ShiprocketApiError(message);
  }
  return data;
}

/** Splits a single "customerName" field into Shiprocket's separate
 * first/last name fields - the order form only ever collects one field. */
function splitName(fullName: string): { first: string; last: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { first: trimmed, last: "" };
  return { first: trimmed.slice(0, spaceIndex), last: trimmed.slice(spaceIndex + 1) };
}

async function createAdhocOrder(
  order: Order,
  items: OrderItem[]
): Promise<{ shiprocketOrderId: string; shipmentId: string }> {
  const pickupLocation = requireEnv("SHIPROCKET_PICKUP_LOCATION");
  const { first, last } = splitName(order.customerName);

  const data = await shiprocketRequest("/orders/create/adhoc", {
    order_id: order.orderNumber,
    order_date: order.createdAt.toISOString().slice(0, 16).replace("T", " "),
    pickup_location: pickupLocation,
    billing_customer_name: first,
    billing_last_name: last,
    billing_address: order.address,
    billing_city: order.city,
    billing_pincode: order.pincode,
    billing_state: order.state,
    billing_country: "India",
    billing_email: order.email,
    billing_phone: order.phone,
    shipping_is_billing: true,
    order_items: items.map((item) => ({
      name: item.name,
      sku: item.productId ?? item.id,
      units: item.quantity,
      selling_price: item.price,
    })),
    payment_method: order.paymentStatus === "PAID" ? "Prepaid" : "COD",
    sub_total: order.subtotal,
    ...DEFAULT_PACKAGE,
  });

  return { shiprocketOrderId: String(data.order_id), shipmentId: String(data.shipment_id) };
}

async function assignAWB(shipmentId: string): Promise<{ awbCode: string; courierName: string }> {
  const data = await shiprocketRequest("/courier/assign/awb", { shipment_id: shipmentId });
  const response = data.response?.data;
  if (!response?.awb_code) {
    throw new ShiprocketApiError("Shiprocket didn't return an AWB - no courier may be serviceable for this address.");
  }
  return { awbCode: String(response.awb_code), courierName: String(response.courier_name ?? "") };
}

/** Pushes a confirmed order to Shiprocket end-to-end: creates the order,
 * then has Shiprocket auto-assign the recommended courier's AWB. */
export async function createShipmentForOrder(order: Order, items: OrderItem[]) {
  const { shiprocketOrderId, shipmentId } = await createAdhocOrder(order, items);
  const { awbCode, courierName } = await assignAWB(shipmentId);
  return {
    shiprocketOrderId,
    shiprocketShipmentId: shipmentId,
    awbCode,
    courierName,
    trackingUrl: `https://shiprocket.co/tracking/${awbCode}`,
  };
}
