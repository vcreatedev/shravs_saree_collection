import { NextResponse } from "next/server";
import { z } from "zod";
import { findOrdersByContact } from "@/lib/orders";

const bodySchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(20),
});

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Enter a valid email and phone number." }, { status: 400 });
  }

  const orders = await findOrdersByContact(body.email, body.phone);
  // Only what the order list shows - each order's own page has the rest.
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt,
      items: o.items.map((i) => ({ _key: i._key, name: i.name, image: i.image, quantity: i.quantity })),
    })),
  });
}
