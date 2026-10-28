import { NextResponse } from "next/server";
import { getCourierQuote, isShiprocketConfigured } from "@/lib/shiprocket";

/* The checkout's pincode check: can any courier partner deliver there, and
   by when. Answers "unknown" while Shiprocket isn't set up, so checkout still
   works. */
export async function GET(request: Request) {
  const pincode = new URL(request.url).searchParams.get("pincode") ?? "";
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: "Enter a 6-digit pincode." }, { status: 400 });
  }
  if (!isShiprocketConfigured()) return NextResponse.json({ status: "unknown" });

  try {
    const quote = await getCourierQuote(pincode, 0.5);
    if (!quote.serviceable) return NextResponse.json({ status: "unserviceable" });
    const fastest = Math.min(...quote.options.map((o) => o.days ?? 99));
    return NextResponse.json({
      status: "serviceable",
      days: Number.isFinite(fastest) && fastest < 99 ? fastest : null,
      couriers: quote.options.length,
    });
  } catch (error) {
    console.error("delivery/check failed", error);
    return NextResponse.json({ status: "unknown" });
  }
}
