import { NextResponse, after } from "next/server";
import { confirmOrderPayment, getOrderByRazorpayOrderId, updateOrder } from "@/lib/orders";
import { verifyRazorpayWebhook } from "@/lib/razorpay";
import { afterPayment } from "@/lib/fulfilment";

/* Razorpay calls this for payment events, signed with RAZORPAY_WEBHOOK_SECRET
   (Razorpay dashboard → Settings → Webhooks, events payment.captured,
   order.paid and payment.failed). It confirms an order the shopper's browser
   didn't - e.g. the tab was closed right after paying. */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !verifyRazorpayWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: Record<string, unknown> }; order?: { entity?: Record<string, unknown> } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity ?? {};
  const razorpayOrderId = String(event.payload?.order?.entity?.id ?? payment.order_id ?? "");
  if (!razorpayOrderId) return NextResponse.json({ received: true });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const result = await confirmOrderPayment(razorpayOrderId, {
      razorpayPaymentId: String(payment.id ?? ""),
      method: payment.method ? String(payment.method) : undefined,
    });
    if (result?.justPaid) after(() => afterPayment(result.order.id));
  } else if (event.event === "payment.failed") {
    const order = await getOrderByRazorpayOrderId(razorpayOrderId);
    if (order && order.paymentStatus === "PENDING") await updateOrder(order.id, { paymentStatus: "FAILED" });
  }

  return NextResponse.json({ received: true });
}
