import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  orderNumber: z.string().min(3),
  email: z.string().email(),
});

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Enter a valid order number and email." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber: body.orderNumber.trim().toUpperCase(),
      email: body.email.trim().toLowerCase(),
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "No order found with that order number and email." },
      { status: 404 }
    );
  }

  return NextResponse.json({ orderId: order.id });
}
