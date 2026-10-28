import "server-only";
import type { Order } from "@/types";

/* Shiprocket: one account that books every courier partner it works with -
   Delhivery, Blue Dart, DTDC, Xpressbees, Ekart, Ecom Express, Shadowfax,
   Amazon Shipping and more - so the store compares and uses all of them
   through this one integration.

   Settings (.env.local locally, the host's environment settings live):
     SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD - an API user (Shiprocket → Settings → API)
     SHIPROCKET_PICKUP_LOCATION - the pickup address's nickname in Shiprocket
     SHIPROCKET_PICKUP_PINCODE - that address's pincode, for rate checks
     SHIPROCKET_WEBHOOK_TOKEN - the security token set on the tracking webhook */

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

export class ShiprocketConfigError extends Error {}
export class ShiprocketApiError extends Error {}

export function isShiprocketConfigured(): boolean {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ShiprocketConfigError(`Shiprocket isn't set up yet: add ${name} to the site's settings.`);
  }
  return value;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: requireEnv("SHIPROCKET_EMAIL"), password: requireEnv("SHIPROCKET_PASSWORD") }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    throw new ShiprocketApiError(`Shiprocket login failed (${res.status}): check SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.`);
  }
  // Tokens last 10 days - kept a day short of that.
  cachedToken = { token: data.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return cachedToken.token;
}

async function request<T = Record<string, unknown>>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown; query?: Record<string, string | number> } = {}
): Promise<T> {
  const token = await getToken();
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401) cachedToken = null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.errors === "object"
          ? Object.values(data.errors).flat().join(" ")
          : `request to ${path} failed (${res.status})`;
    throw new ShiprocketApiError(message);
  }
  return data as T;
}

/* ── Rates and serviceability ── */

export type CourierOption = {
  id: number;
  name: string;
  rate: number;
  /** Working days to deliver. */
  days: number | null;
  /** Expected delivery date, e.g. "Nov 02, 2026". */
  etd: string;
  rating: number | null;
  isSurface: boolean;
};

export type CourierQuote = {
  serviceable: boolean;
  options: CourierOption[];
  recommendedId: number | null;
};

type ServiceabilityResponse = {
  status?: number;
  data?: {
    available_courier_companies?: Array<Record<string, unknown>>;
    recommended_courier_company_id?: number;
    shiprocket_recommended_courier_id?: number;
  };
};

/** Every courier partner that can deliver a prepaid parcel of this weight
 * from the store's pickup address to the pincode, with its rate and dates. */
export async function getCourierQuote(deliveryPincode: string, weightKg: number, declaredValue?: number): Promise<CourierQuote> {
  const data = await request<ServiceabilityResponse>("/courier/serviceability/", {
    query: {
      pickup_postcode: requireEnv("SHIPROCKET_PICKUP_PINCODE"),
      delivery_postcode: deliveryPincode,
      weight: Math.max(0.05, Number(weightKg.toFixed(2))),
      cod: 0,
      ...(declaredValue ? { declared_value: Math.round(declaredValue) } : {}),
    },
  }).catch((error) => {
    // Shiprocket answers an unserviceable pincode with an error status.
    if (error instanceof ShiprocketApiError) return { data: {} } as ServiceabilityResponse;
    throw error;
  });

  const companies = data.data?.available_courier_companies ?? [];
  const options: CourierOption[] = companies.map((c) => ({
    id: Number(c.courier_company_id),
    name: String(c.courier_name ?? ""),
    rate: Number(c.rate ?? c.freight_charge ?? 0),
    days: c.estimated_delivery_days ? Number(c.estimated_delivery_days) : null,
    etd: String(c.etd ?? ""),
    rating: c.rating !== undefined && c.rating !== null ? Number(c.rating) : null,
    isSurface: Boolean(c.is_surface),
  }));
  return {
    serviceable: options.length > 0,
    options: options.sort((a, b) => a.rate - b.rate),
    recommendedId: data.data?.recommended_courier_company_id ?? data.data?.shiprocket_recommended_courier_id ?? null,
  };
}

/** Picks a courier from a quote: Shiprocket's recommendation, the cheapest,
 * the fastest, or the best rated. */
export function chooseCourier(quote: CourierQuote, choice: "recommended" | "cheapest" | "fastest" | "rated"): CourierOption | null {
  const { options } = quote;
  if (options.length === 0) return null;
  if (choice === "cheapest") return options[0];
  if (choice === "fastest") return [...options].sort((a, b) => (a.days ?? 99) - (b.days ?? 99) || a.rate - b.rate)[0];
  if (choice === "rated") return [...options].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.rate - b.rate)[0];
  return options.find((o) => o.id === quote.recommendedId) ?? options[0];
}

/* ── Booking ── */

/** Splits the one name field the checkout collects into first and last. */
function splitName(fullName: string): { first: string; last: string } {
  const trimmed = fullName.trim();
  const space = trimmed.indexOf(" ");
  return space === -1 ? { first: trimmed, last: "" } : { first: trimmed.slice(0, space), last: trimmed.slice(space + 1) };
}

export function parcelWeight(order: Order): number {
  return order.items.reduce((sum, item) => sum + (item.weightKg || 0.5) * item.quantity, 0);
}

/** Creates the order in Shiprocket; it then needs a courier (assignCourier). */
export async function createShiprocketOrder(order: Order): Promise<{ srOrderId: string; shipmentId: string }> {
  const { first, last } = splitName(order.customer.name);
  const data = await request<{ order_id?: number; shipment_id?: number; status?: string }>("/orders/create/adhoc", {
    body: {
      order_id: order.orderNumber,
      order_date: order.createdAt.slice(0, 16).replace("T", " "),
      pickup_location: requireEnv("SHIPROCKET_PICKUP_LOCATION"),
      billing_customer_name: first,
      billing_last_name: last,
      billing_address: order.shippingAddress.address,
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.pincode,
      billing_state: order.shippingAddress.state,
      billing_country: "India",
      billing_email: order.customer.email,
      billing_phone: order.customer.phoneDigits || order.customer.phone,
      shipping_is_billing: true,
      order_items: order.items.map((item) => ({
        name: [item.name, item.color, item.size].filter(Boolean).join(" - "),
        sku: item.code || item.productId,
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: "Prepaid",
      shipping_charges: order.shipping,
      sub_total: order.subtotal,
      length: 30,
      breadth: 25,
      height: Math.min(30, 5 * Math.max(1, order.items.reduce((n, i) => n + i.quantity, 0))),
      weight: parcelWeight(order),
    },
  });
  if (!data.order_id || !data.shipment_id) {
    throw new ShiprocketApiError("Shiprocket didn't return a shipment for this order.");
  }
  return { srOrderId: String(data.order_id), shipmentId: String(data.shipment_id) };
}

/** Books the courier for a shipment and gets its AWB (tracking) number.
 * Without a courier id, Shiprocket assigns its recommended one. */
export async function assignCourier(shipmentId: string, courierId?: number): Promise<{ awb: string; courierName: string; courierId: number | null }> {
  const data = await request<{ awb_assign_status?: number; response?: { data?: Record<string, unknown> }; message?: string }>(
    "/courier/assign/awb",
    { body: { shipment_id: shipmentId, ...(courierId ? { courier_id: courierId } : {}) } }
  );
  const result = data.response?.data;
  if (!result?.awb_code) {
    throw new ShiprocketApiError(
      typeof data.message === "string" && data.message
        ? data.message
        : "No AWB was assigned - this courier may not serve the address, or the Shiprocket wallet may be low."
    );
  }
  return {
    awb: String(result.awb_code),
    courierName: String(result.courier_name ?? ""),
    courierId: result.courier_company_id ? Number(result.courier_company_id) : courierId ?? null,
  };
}

/** Asks the courier to collect the parcel from the pickup address. */
export async function schedulePickup(shipmentId: string): Promise<{ scheduledFor: string }> {
  const data = await request<{ response?: { pickup_scheduled_date?: string; data?: string } }>("/courier/generate/pickup", {
    body: { shipment_id: [Number(shipmentId)] },
  });
  return { scheduledFor: String(data.response?.pickup_scheduled_date ?? "") };
}

export async function generateLabel(shipmentId: string): Promise<string> {
  const data = await request<{ label_url?: string; label_created?: number }>("/courier/generate/label", {
    body: { shipment_id: [Number(shipmentId)] },
  });
  if (!data.label_url) throw new ShiprocketApiError("Shiprocket didn't return a label - book a courier first.");
  return data.label_url;
}

export async function generateManifest(shipmentId: string): Promise<string> {
  const data = await request<{ manifest_url?: string }>("/manifests/generate", {
    body: { shipment_id: [Number(shipmentId)] },
  });
  if (!data.manifest_url) throw new ShiprocketApiError("Shiprocket didn't return a manifest - schedule the pickup first.");
  return data.manifest_url;
}

export async function cancelShiprocketOrder(srOrderId: string): Promise<void> {
  await request("/orders/cancel", { body: { ids: [Number(srOrderId)] } });
}

/* ── Tracking ── */

export type TrackingScan = { date: string; status: string; activity: string; location: string };

export type TrackingUpdate = {
  awb: string;
  courierName: string;
  status: string;
  etd: string;
  trackingUrl: string;
  scans: TrackingScan[];
};

export function trackingUrlFor(awb: string): string {
  return `https://shiprocket.co/tracking/${awb}`;
}

/** The latest whereabouts of a parcel, straight from the courier. */
export async function trackAwb(awb: string): Promise<TrackingUpdate> {
  const data = await request<{ tracking_data?: Record<string, unknown> }>(`/courier/track/awb/${encodeURIComponent(awb)}`);
  const tracking = data.tracking_data ?? {};
  const track = (tracking.shipment_track as Record<string, unknown>[] | undefined)?.[0] ?? {};
  const activities = (tracking.shipment_track_activities as Record<string, unknown>[] | undefined) ?? [];
  return {
    awb,
    courierName: String(track.courier_name ?? ""),
    status: String(track.current_status ?? ""),
    etd: String(tracking.etd ?? track.edd ?? ""),
    trackingUrl: String(tracking.track_url ?? trackingUrlFor(awb)),
    scans: activities.map((a) => ({
      date: String(a.date ?? ""),
      status: String(a["sr-status-label"] ?? a.status ?? ""),
      activity: String(a.activity ?? ""),
      location: String(a.location ?? ""),
    })),
  };
}

/** Reads one of Shiprocket's webhook tracking updates. */
export function parseTrackingWebhook(body: Record<string, unknown>): TrackingUpdate | null {
  const awb = body.awb ? String(body.awb) : "";
  if (!awb) return null;
  const scans = Array.isArray(body.scans) ? (body.scans as Record<string, unknown>[]) : [];
  return {
    awb,
    courierName: String(body.courier_name ?? ""),
    status: String(body.current_status ?? body.shipment_status ?? ""),
    etd: String(body.etd ?? ""),
    trackingUrl: trackingUrlFor(awb),
    scans: scans.map((s) => ({
      date: String(s.date ?? ""),
      status: String(s["sr-status-label"] ?? s.status ?? ""),
      activity: String(s.activity ?? ""),
      location: String(s.location ?? ""),
    })),
  };
}
