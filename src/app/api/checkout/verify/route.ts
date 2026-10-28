import { NextResponse, after } from "next/server";
import { z } from "zod";
import { confirmOrderPayment, getOrderById } from "@/lib/orders";
import { paymentMethodFor, verifyRazorpaySignature } from "@/lib/razorpay";
import { afterPayment } from "@/lib/fulfilment";

const bodySchema = z.object({
  orderId: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

/* The shopper's browser reports a finished payment here. Razorpay's webhook
   (/api/razorpay/webhook) reports the same payment on its own, in case the
   browser never gets here; whichever arrives first confirms the order. */
export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const order = await getOrderById(body.orderId);
  if (!order || order.payment.razorpayOrderId !== body.razorpay_order_id) {
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

  try {
    const method = await paymentMethodFor(body.razorpay_payment_id);
    const result = await confirmOrderPayment(body.razorpay_order_id, {
      razorpayPaymentId: body.razorpay_payment_id,
      method,
    });
    if (!result) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    // Emails and courier booking after replying, so the shopper's
    // confirmation page doesn't wait on them - only from the report that
    // actually confirmed the payment, so a repeat can't send them twice.
    if (result.justPaid) after(() => afterPayment(result.order.id));
    return NextResponse.json({ ok: true, orderId: result.order.id, orderNumber: result.order.orderNumber });
  } catch (error) {
    console.error("checkout/verify failed to confirm order", error);
    return NextResponse.json(
      { error: "Payment succeeded but confirming your order timed out. Please contact us with your order number." },
      { status: 500 }
    );
  }
}
