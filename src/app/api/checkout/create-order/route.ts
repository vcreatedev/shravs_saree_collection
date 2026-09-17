import { NextResponse } from "next/server";
import { z } from "zod";
import { createPendingOrder, OrderValidationError } from "@/lib/orders";
import { getRazorpayClient } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

const addressSchema = z.object({
  customerName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  pincode: z.string().min(3).max(12),
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
    return NextResponse.json({ error: "Invalid checkout data." }, { status: 400 });
  }

  try {
    const order = await createPendingOrder(body.items, body.address, body.paymentMethod);

    const razorpay = getRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order.orderNumber,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

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
    return NextResponse.json({ error: "Could not create order. Please try again." }, { status: 500 });
  }
}
