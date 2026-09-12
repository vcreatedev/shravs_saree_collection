import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { markOrderConfirmed } from "@/lib/orders";

const bodySchema = z.object({
  orderId: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!order || order.razorpayOrderId !== body.razorpay_order_id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const valid = verifyRazorpaySignature({
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id,
    signature: body.razorpay_signature,
  });

  if (!valid) {
    return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  const confirmed = await markOrderConfirmed(order.id, "PAID", {
    razorpayOrderId: body.razorpay_order_id,
    razorpayPaymentId: body.razorpay_payment_id,
  });

  return NextResponse.json({ ok: true, orderId: confirmed.id });
}
