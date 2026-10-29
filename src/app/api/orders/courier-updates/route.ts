import crypto from "crypto";
import { NextResponse } from "next/server";
import { applyCourierUpdate } from "@/lib/orders";

export async function POST(req: Request) {
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "SHIPROCKET_WEBHOOK_TOKEN is not set on this site" }, { status: 501 });
  }
  const given = Buffer.from(req.headers.get("x-api-key") || "");
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  try {
    const result = await applyCourierUpdate(update);
    return NextResponse.json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[orders] Could not apply a courier update:", message);
    return NextResponse.json({ result: "error", error: message }, { status: 500 });
  }
}
