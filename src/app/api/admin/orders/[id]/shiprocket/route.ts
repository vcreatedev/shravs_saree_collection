import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createShipmentForOrder, ShiprocketApiError, ShiprocketConfigError } from "@/lib/shiprocket";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.awbCode) {
    return NextResponse.json({ error: "This order already has a shipment." }, { status: 409 });
  }
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Cannot ship a cancelled order." }, { status: 400 });
  }

  try {
    const shipment = await createShipmentForOrder(order, order.items);
    const updated = await prisma.order.update({
      where: { id },
      data: { ...shipment, status: "SHIPPED" },
    });
    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof ShiprocketConfigError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ShiprocketApiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Could not create the shipment." }, { status: 500 });
  }
}
