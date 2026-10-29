import { NextResponse } from "next/server";
import { getAvailableCouriers } from "@/lib/shiprocket";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pincode = searchParams.get("pincode") || "";
  const pieces = Number(searchParams.get("pieces")) || 1;

  if (!pincode) {
    return NextResponse.json({ configured: false, error: "Pincode is required", couriers: [] }, { status: 400 });
  }

  try {
    const result = await getAvailableCouriers(pincode, pieces);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ configured: true, error: message, couriers: [] }, { status: 500 });
  }
}
