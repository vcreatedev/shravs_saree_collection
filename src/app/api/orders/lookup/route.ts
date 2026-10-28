import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrderFlexible } from "@/lib/orders";

const bodySchema = z.object({
  query: z.string().optional(),
  orderNumber: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid search query." }, { status: 400 });
  }

  const query = body.query || body.orderNumber;
  if (!query && !body.email && !body.phone) {
    return NextResponse.json(
      { error: "Please enter your Order ID, Payment ID, AWB, Email or Phone." },
      { status: 400 }
    );
  }

  const order = await findOrderFlexible(query || body.email || body.phone || "", body.email || body.phone);
  if (!order) {
    return NextResponse.json(
      { error: "No matching order found. Please check your order details or contact us on WhatsApp." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.orderNumber, order });
}
