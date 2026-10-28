import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders";
import { getSiteSettings } from "@/lib/catalog";
import { generateInvoicePdf } from "@/lib/invoice";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const order = await getOrderById((await params).id);
  if (!order || order.paymentStatus === "PENDING") {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const pdfBytes = await generateInvoicePdf(order, await getSiteSettings());
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${order.orderNumber}.pdf"`,
    },
  });
}
