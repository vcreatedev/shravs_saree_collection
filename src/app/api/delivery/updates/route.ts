import { NextResponse } from "next/server";
import { getOrderByAwb } from "@/lib/orders";
import { applyTrackingUpdate } from "@/lib/fulfilment";
import { parseTrackingWebhook } from "@/lib/shiprocket";

/* Shiprocket calls this whenever a parcel's status changes (Shiprocket →
   Settings → API → Webhooks), sending the token set there in the x-api-key
   header; it must match SHIPROCKET_WEBHOOK_TOKEN. Shiprocket refuses webhook
   addresses containing "shiprocket", so this route is named "delivery". */
export async function POST(request: Request) {
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (!expected || request.headers.get("x-api-key") !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const update = parseTrackingWebhook(body);
  if (!update) return NextResponse.json({ received: true });

  const order = await getOrderByAwb(update.awb);
  if (!order) {
    // Shipments booked outside this site have no order here - fine to ignore.
    return NextResponse.json({ received: true, matched: false });
  }

  try {
    await applyTrackingUpdate(order, update);
  } catch (error) {
    console.error(`[delivery] Could not save tracking for AWB ${update.awb}`, error);
    // A 5xx makes Shiprocket retry later.
    return NextResponse.json({ error: "Could not save the update." }, { status: 500 });
  }
  return NextResponse.json({ received: true, matched: true });
}
