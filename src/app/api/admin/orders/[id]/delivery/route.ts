import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById } from "@/lib/orders";
import { studioUser } from "@/lib/studio-auth";
import {
  bookShipment,
  cancelShipment,
  labelForOrder,
  manifestForOrder,
  pickupForOrder,
  quoteForOrder,
  recordManualShipment,
  refreshTracking,
  setOrderStatus,
} from "@/lib/fulfilment";
import { isShiprocketConfigured, ShiprocketApiError, ShiprocketConfigError } from "@/lib/shiprocket";

/* The Studio's Orders tool: courier rates and every delivery action for one
   order. Only editors of this Sanity project get through (lib/studio-auth). */

type Params = { params: Promise<{ id: string }> };

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("book"), courierId: z.number().int().positive().optional() }),
  z.object({ action: z.literal("pickup") }),
  z.object({ action: z.literal("label") }),
  z.object({ action: z.literal("manifest") }),
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("track") }),
  z.object({
    action: z.literal("status"),
    status: z.enum(["CONFIRMED", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"]),
  }),
  z.object({
    action: z.literal("manual"),
    courierName: z.string().trim().min(2).max(80),
    awb: z.string().trim().min(3).max(60),
    trackingUrl: z.string().trim().url().optional().or(z.literal("")),
  }),
]);

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  const status = error instanceof ShiprocketConfigError ? 501 : error instanceof ShiprocketApiError ? 502 : 400;
  return NextResponse.json({ error: message }, { status });
}

/** The couriers that can deliver this order, cheapest first. */
export async function GET(request: Request, { params }: Params) {
  if (!(await studioUser(request))) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  const order = await getOrderById((await params).id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!isShiprocketConfigured()) {
    return NextResponse.json({ configured: false, quote: null });
  }
  try {
    return NextResponse.json({ configured: true, quote: await quoteForOrder(order) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  if (!(await studioUser(request))) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  const { id } = await params;

  let body;
  try {
    body = actionSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "book":
        return NextResponse.json({ order: await bookShipment(id, { courierId: body.courierId }) });
      case "pickup":
        return NextResponse.json({ order: await pickupForOrder(id) });
      case "label":
        return NextResponse.json({ url: await labelForOrder(id) });
      case "manifest":
        return NextResponse.json({ url: await manifestForOrder(id) });
      case "cancel":
        return NextResponse.json({ order: await cancelShipment(id) });
      case "track":
        return NextResponse.json({ order: await refreshTracking(id) });
      case "status":
        return NextResponse.json({ order: await setOrderStatus(id, body.status) });
      case "manual":
        return NextResponse.json({
          order: await recordManualShipment(id, {
            courierName: body.courierName,
            awb: body.awb,
            trackingUrl: body.trackingUrl || undefined,
          }),
        });
    }
  } catch (error) {
    return failure(error);
  }
}
