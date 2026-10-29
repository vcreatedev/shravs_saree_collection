import { NextResponse } from "next/server";
import { bookShipmentOnce } from "@/lib/orders";

const DATASETS = ["production", "development"];

export async function POST(req: Request) {
  const { orderId, dataset, courierId } = await req.json().catch(() => ({}));
  if (!orderId || (dataset && !DATASETS.includes(dataset))) {
    return NextResponse.json({ result: "bad-request" }, { status: 400 });
  }

  try {
    const { status, result } = await bookShipmentOnce(String(orderId), dataset, courierId);
    return NextResponse.json({ result }, { status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[orders] Could not book the shipment:", message);
    return NextResponse.json({ result: "error", error: message }, { status: 500 });
  }
}
