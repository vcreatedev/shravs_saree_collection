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

  // Idempotent: if a prior call already confirmed this order (e.g. the client
  // retried after a slow/dropped response), don't re-run the stock decrement.
  if (order.status === "CONFIRMED") {
    return NextResponse.json({ ok: true, orderId: order.id });
  }

  const valid = verifyRazorpaySignature({
    orderId: body.razorpay_order_id,
    paymentId: body.razorpay_payment_id,
    signature: body.razorpay_signature,
  });

  if (!valid) {
    return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  try {
    const confirmed = await markOrderConfirmed(order.id, "PAID", {
      razorpayOrderId: body.razorpay_order_id,
      razorpayPaymentId: body.razorpay_payment_id,
    });
    return NextResponse.json({ ok: true, orderId: confirmed.id });
  } catch (error) {
    console.error("checkout/verify failed to confirm order", error);
    return NextResponse.json(
      { error: "Payment succeeded but confirming your order timed out. Please contact support with your order ID." },
      { status: 500 }
    );
  }
}
