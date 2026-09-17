import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import type { OrderWithItems } from "@/types";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";
const INK = rgb(0.09, 0.078, 0.06);
const SOFT = rgb(0.42, 0.39, 0.34);
const SIGNAL = rgb(1, 0.29, 0.12);
const LINE = rgb(0.9, 0.87, 0.8);

function money(value: number) {
  return `Rs. ${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

async function embedItemImage(pdf: PDFDocument, url: string): Promise<PDFImage | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("png")) {
      return await pdf.embedPng(bytes);
    }
    return await pdf.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(order: OrderWithItems): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = height - 60;
  const marginX = 50;

  page.drawText(STORE_NAME, { x: marginX, y, size: 24, font: bold, color: INK });
  page.drawText("INVOICE", { x: width - marginX - 90, y, size: 20, font: bold, color: SIGNAL });

  y -= 22;
  page.drawText("Handpicked sarees, for every occasion", { x: marginX, y, size: 10, font, color: SOFT });
  page.drawText(`#${order.orderNumber}`, { x: width - marginX - 90, y, size: 11, font, color: SOFT });

  y -= 40;
  page.drawLine({ start: { x: marginX, y }, end: { x: width - marginX, y }, thickness: 1, color: LINE });

  y -= 28;
  page.drawText("BILLED TO", { x: marginX, y, size: 9, font: bold, color: SOFT });
  page.drawText("ORDER DATE", { x: marginX + 260, y, size: 9, font: bold, color: SOFT });
  page.drawText("PAYMENT", { x: width - marginX - 130, y, size: 9, font: bold, color: SOFT });

  y -= 16;
  page.drawText(order.customerName, { x: marginX, y, size: 11, font: bold, color: INK });
  page.drawText(new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }), { x: marginX + 260, y, size: 10, font, color: INK });
  page.drawText(order.paymentMethod, { x: width - marginX - 130, y, size: 10, font, color: INK });

  y -= 16;
  page.drawText(order.address, { x: marginX, y, size: 10, font, color: SOFT, maxWidth: 240 });
  page.drawText(order.paymentStatus, { x: width - marginX - 130, y, size: 10, font, color: SOFT });

  y -= 14;
  page.drawText(`${order.city}, ${order.state} ${order.pincode}`, {
    x: marginX,
    y,
    size: 10,
    font,
    color: SOFT,
  });

  y -= 14;
  page.drawText(`${order.email} · ${order.phone}`, { x: marginX, y, size: 10, font, color: SOFT });

  y -= 36;
  page.drawRectangle({ x: marginX, y: y - 6, width: width - marginX * 2, height: 24, color: rgb(0.09, 0.078, 0.06) });
  page.drawText("ITEM", { x: marginX + 10, y, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("QTY", { x: marginX + 300, y, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("PRICE", { x: marginX + 360, y, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("TOTAL", { x: width - marginX - 70, y, size: 9, font: bold, color: rgb(1, 1, 1) });

  y -= 12;
  const thumbSize = 36;
  const textX = marginX + 10 + thumbSize + 10;

  for (const item of order.items) {
    if (y < 150) break;
    const rowTop = y;
    const image = await embedItemImage(pdf, item.image);

    if (image) {
      const scale = Math.min(thumbSize / image.width, thumbSize / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      page.drawImage(image, {
        x: marginX + 10 + (thumbSize - drawWidth) / 2,
        y: rowTop - thumbSize + (thumbSize - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const label = item.color || item.size ? `${item.name} (${[item.color, item.size].filter(Boolean).join(", ")})` : item.name;
    const textY = rowTop - thumbSize / 2 - 4;
    page.drawText(label, { x: textX, y: textY, size: 10, font, color: INK, maxWidth: 220 });
    page.drawText(String(item.quantity), { x: marginX + 300, y: textY, size: 10, font, color: INK });
    page.drawText(money(item.price), { x: marginX + 360, y: textY, size: 10, font, color: INK });
    page.drawText(money(item.price * item.quantity), { x: width - marginX - 70, y: textY, size: 10, font, color: INK });

    y = rowTop - thumbSize - 14;
    page.drawLine({
      start: { x: marginX, y: y + 8 },
      end: { x: width - marginX, y: y + 8 },
      thickness: 0.5,
      color: LINE,
    });
  }

  y -= 10;
  const totalsX = width - marginX - 190;
  y -= 14;
  page.drawText("Subtotal", { x: totalsX, y, size: 10, font, color: SOFT });
  page.drawText(money(order.subtotal), { x: width - marginX - 70, y, size: 10, font, color: INK });

  y -= 18;
  page.drawText("Shipping", { x: totalsX, y, size: 10, font, color: SOFT });
  page.drawText(order.shipping === 0 ? "Free" : money(order.shipping), {
    x: width - marginX - 70,
    y,
    size: 10,
    font,
    color: INK,
  });

  y -= 22;
  page.drawLine({ start: { x: totalsX, y: y + 10 }, end: { x: width - marginX, y: y + 10 }, thickness: 1, color: INK });
  page.drawText("Total", { x: totalsX, y, size: 13, font: bold, color: INK });
  page.drawText(money(order.total), { x: width - marginX - 80, y, size: 13, font: bold, color: SIGNAL });

  page.drawText(`Thank you for shopping with ${STORE_NAME}.`, {
    x: marginX,
    y: 60,
    size: 9,
    font,
    color: SOFT,
  });

  return pdf.save();
}
