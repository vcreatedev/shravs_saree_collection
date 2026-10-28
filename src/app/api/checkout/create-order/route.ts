import { NextResponse } from "next/server";
import { z } from "zod";
import { attachRazorpayOrder, createPendingOrder, OrderValidationError } from "@/lib/orders";
import { getRazorpayClient } from "@/lib/razorpay";
import { getCourierQuote, isShiprocketConfigured } from "@/lib/shiprocket";

const addressSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(10).max(20),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode."),
});

const lineSchema = z.object({
  productId: z.string(),
  name: z.string(),
  slug: z.string(),
  image: z.string(),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive().max(50),
  color: z.string().optional(),
  size: z.string().optional(),
  stock: z.number().int().nonnegative(),
});

const bodySchema = z.object({
  items: z.array(lineSchema).min(1),
  address: addressSchema,
  paymentMethod: z.literal("RAZORPAY"),
});

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  try {
    // Refuse a pincode no courier delivers to before taking payment for it.
    if (isShiprocketConfigured()) {
      const quote = await getCourierQuote(body.address.pincode, 0.5).catch(() => null);
      if (quote && !quote.serviceable) {
        return NextResponse.json(
          { error: `Sorry, we can't deliver to pincode ${body.address.pincode} yet. Please contact us on WhatsApp.` },
          { status: 422 }
        );
      }
    }

    const order = await createPendingOrder(body.items, body.address);

    const razorpayOrder = await getRazorpayClient().orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order.orderNumber,
      // Lets Razorpay's webhook find this order if the shopper closes the tab
      // right after paying.
      notes: { orderId: order.id, orderNumber: order.orderNumber },
    });
    await attachRazorpayOrder(order.id, razorpayOrder.id);

    return NextResponse.json({
      method: "RAZORPAY",
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      customerName: body.address.customerName,
      email: body.address.email,
      phone: body.address.phone,
    });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("checkout/create-order failed", error);
    return NextResponse.json({ error: "Could not create your order. Please try again." }, { status: 500 });
  }
}
