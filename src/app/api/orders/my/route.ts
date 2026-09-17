import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(20),
});

export async function POST(request: Request) {
  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Enter a valid email and phone number." }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: {
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return NextResponse.json({ orders });
}
