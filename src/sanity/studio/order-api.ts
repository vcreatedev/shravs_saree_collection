import type { SanityClient } from "sanity";
import type { Order } from "@/types";

export const ORDERS_API_VERSION = "2026-02-01";

/** The dataset the site itself reads and writes - delivery actions run there. */
export const SITE_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const ORDER_PROJECTION = `{ ..., "id": string::split(_id, "orders.")[1] }`;

export type StudioOrder = Order & { _rev: string };

/** Calls the site's delivery route for one order with the editor's own
 * Sanity login, which the site checks with Sanity (lib/studio-auth.ts). */
export async function deliveryRequest<T>(
  client: SanityClient,
  orderId: string,
  body?: Record<string, unknown>
): Promise<T> {
  const token = client.config().token;
  const res = await fetch(`/api/admin/orders/${orderId}/delivery`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? "The site couldn't confirm your Sanity login - sign out of the Studio and back in."
        : data.error || `Request failed (${res.status})`
    );
  }
  return data as T;
}

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
