import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import type { Order } from "@/types";
import type { SiteSettings } from "./catalog";

// Brand palette: deep wine header, antique gold accents, espresso ink, warm soft text
const WINE = rgb(0.392, 0.075, 0.184); // #64132f
const GOLD = rgb(0.788, 0.604, 0.231); // #c99a3b
const INK = rgb(0.122, 0.067, 0.039); // #1f110a
const SOFT = rgb(0.49, 0.365, 0.212); // #7d5d36
const LINE = rgb(0.85, 0.78, 0.65); // subtle divider
const PAPER = rgb(0.98, 0.965, 0.94); // soft cream card fill
const FOREST = rgb(0.082, 0.502, 0.239); // #15803d success

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function embedImage(pdf: PDFDocument, url: string): Promise<PDFImage | null> {
  const bytes = await fetchImageBytes(url);
  if (!bytes) return null;
  try {
    return await pdf.embedPng(bytes);
  } catch {
    try {
      return await pdf.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

export async function generateInvoicePdf(order: Order, settings: SiteSettings): Promise<Uint8Array> {
  const STORE_NAME = settings.storeName || "Shravs Saree Collection";
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const marginX = 40;
  const contentWidth = width - marginX * 2;

  // 1. Top Decorative Brand Bar
  page.drawRectangle({
    x: 0,
    y: height - 12,
    width,
    height: 12,
    color: WINE,
  });
  page.drawRectangle({
    x: 0,
    y: height - 15,
    width,
    height: 3,
    color: GOLD,
  });

  // 2. Logo & Brand Header
  let y = height - 55;
  let brandTextX = marginX;

  if (settings.logo) {
    const logoImg = await embedImage(pdf, settings.logo);
    if (logoImg) {
      const logoSize = 42;
      page.drawImage(logoImg, {
        x: marginX,
        y: y - 10,
        width: logoSize,
        height: logoSize,
      });
      brandTextX = marginX + logoSize + 12;
    }
  }

  page.drawText(STORE_NAME, {
    x: brandTextX,
    y,
    size: 18,
    font: bold,
    color: INK,
  });

  y -= 14;
  page.drawText(settings.tagline || "HANDPICKED SAREES · WOVEN WITH A STORY", {
    x: brandTextX,
    y,
    size: 7.5,
    font: bold,
    color: GOLD,
  });

  y -= 13;
  page.drawText(`${settings.location || "Hyderabad, Telangana, India"} | Care: ${settings.supportEmail || "support@store.com"} | ${settings.displayPhone || ""}`, {
    x: brandTextX,
    y,
    size: 7.5,
    font,
    color: SOFT,
  });

  // Invoice Title Badge (Top Right)
  const badgeWidth = 130;
  const badgeHeight = 36;
  const badgeX = width - marginX - badgeWidth;
  const badgeY = height - 70;

  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: PAPER,
    borderColor: GOLD,
    borderWidth: 0.8,
  });
  page.drawText("TAX INVOICE", {
    x: badgeX + 22,
    y: badgeY + 20,
    size: 11,
    font: bold,
    color: WINE,
  });
  page.drawText("Original for Recipient", {
    x: badgeX + 16,
    y: badgeY + 8,
    size: 8,
    font,
    color: SOFT,
  });

  // 3. Metadata Card (Order Number, Date, Payment ID, Status)
  y = height - 120;
  page.drawRectangle({
    x: marginX,
    y: y - 28,
    width: contentWidth,
    height: 40,
    color: PAPER,
    borderColor: LINE,
    borderWidth: 0.5,
  });

  const colW = contentWidth / 4;
  const metaY = y;

  // Col 1: Order Number
  page.drawText("INVOICE NO.", { x: marginX + 10, y: metaY, size: 7.5, font: bold, color: GOLD });
  page.drawText(`#${order.orderNumber}`, { x: marginX + 10, y: metaY - 12, size: 9, font: bold, color: INK });

  // Col 2: Date
  page.drawText("ORDER DATE", { x: marginX + colW + 10, y: metaY, size: 7.5, font: bold, color: GOLD });
  page.drawText(
    new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    { x: marginX + colW + 10, y: metaY - 12, size: 8.5, font, color: INK }
  );

  // Col 3: Payment ID
  page.drawText("PAYMENT ID", { x: marginX + colW * 2 + 10, y: metaY, size: 7.5, font: bold, color: GOLD });
  const paymentText = order.payment?.razorpayPaymentId || order.payment?.method || "Verified (Online)";
  page.drawText(paymentText.slice(0, 18), { x: marginX + colW * 2 + 10, y: metaY - 12, size: 8, font, color: INK });

  // Col 4: Payment Status
  page.drawText("PAYMENT STATUS", { x: marginX + colW * 3 + 10, y: metaY, size: 7.5, font: bold, color: GOLD });
  page.drawText(order.paymentStatus === "PAID" ? "PAID · CONFIRMED" : order.paymentStatus, {
    x: marginX + colW * 3 + 10,
    y: metaY - 12,
    size: 8.5,
    font: bold,
    color: order.paymentStatus === "PAID" ? FOREST : SOFT,
  });

  // 4. Customer Billed & Shipping Address
  y -= 48;
  page.drawText("BILLED & DELIVERING TO:", { x: marginX, y, size: 8, font: bold, color: GOLD });
  y -= 13;
  page.drawText(order.customer.name, { x: marginX, y, size: 10, font: bold, color: INK });
  y -= 12;
  page.drawText(`${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} – ${order.shippingAddress.pincode}`, {
    x: marginX,
    y,
    size: 8.5,
    font,
    color: SOFT,
    maxWidth: contentWidth - 40,
  });
  y -= 11;
  page.drawText(`Phone: ${order.customer.phone} · Email: ${order.customer.email}`, {
    x: marginX,
    y,
    size: 8.5,
    font,
    color: SOFT,
  });

  // 5. Items Table Header
  y -= 26;
  page.drawRectangle({
    x: marginX,
    y: y - 5,
    width: contentWidth,
    height: 22,
    color: WINE,
  });

  page.drawText("DRAPE & SPECIFICATION", { x: marginX + 10, y: y + 2, size: 7.5, font: bold, color: rgb(1, 1, 1) });
  page.drawText("CODE", { x: marginX + 230, y: y + 2, size: 7.5, font: bold, color: rgb(1, 1, 1) });
  page.drawText("QTY", { x: marginX + 310, y: y + 2, size: 7.5, font: bold, color: rgb(1, 1, 1) });
  page.drawText("RATE", { x: marginX + 370, y: y + 2, size: 7.5, font: bold, color: rgb(1, 1, 1) });
  page.drawText("TOTAL", { x: width - marginX - 60, y: y + 2, size: 7.5, font: bold, color: rgb(1, 1, 1) });

  y -= 12;
  const thumbSize = 32;

  // 6. Item Rows
  for (const item of order.items) {
    if (y < 160) break;
    const rowTop = y;

    if (item.image) {
      const itemImg = await embedImage(pdf, item.image);
      if (itemImg) {
        const scale = Math.min(thumbSize / itemImg.width, thumbSize / itemImg.height);
        const w = itemImg.width * scale;
        const h = itemImg.height * scale;
        page.drawImage(itemImg, {
          x: marginX + 10 + (thumbSize - w) / 2,
          y: rowTop - thumbSize + (thumbSize - h) / 2,
          width: w,
          height: h,
        });
      }
    }

    const titleX = marginX + 10 + thumbSize + 8;
    const variantInfo = [item.color ? `Color: ${item.color}` : "", item.size ? `Size: ${item.size}` : ""].filter(Boolean).join(" · ");

    page.drawText(item.name.slice(0, 42), {
      x: titleX,
      y: rowTop - 12,
      size: 9,
      font: bold,
      color: INK,
      maxWidth: 170,
    });

    if (variantInfo) {
      page.drawText(variantInfo, {
        x: titleX,
        y: rowTop - 22,
        size: 7.5,
        font,
        color: SOFT,
      });
    }

    // Code
    page.drawText(item.code || "—", { x: marginX + 230, y: rowTop - 14, size: 8, font, color: SOFT });
    // Qty
    page.drawText(String(item.quantity), { x: marginX + 315, y: rowTop - 14, size: 8.5, font, color: INK });
    // Rate
    page.drawText(money(item.price), { x: marginX + 370, y: rowTop - 14, size: 8.5, font, color: INK });
    // Line Total
    page.drawText(money(item.price * item.quantity), { x: width - marginX - 60, y: rowTop - 14, size: 8.5, font: bold, color: INK });

    y = rowTop - thumbSize - 10;
    page.drawLine({
      start: { x: marginX, y: y + 4 },
      end: { x: width - marginX, y: y + 4 },
      thickness: 0.5,
      color: LINE,
    });
  }

  // 7. Totals Summary & Boutique Seal
  y -= 8;
  const totalsLeft = width - marginX - 180;

  // Subtotal
  page.drawText("Subtotal", { x: totalsLeft, y, size: 8.5, font, color: SOFT });
  page.drawText(money(order.subtotal), { x: width - marginX - 60, y, size: 8.5, font, color: INK });

  // Shipping
  y -= 14;
  page.drawText("Insured Delivery", { x: totalsLeft, y, size: 8.5, font, color: SOFT });
  page.drawText(order.shipping === 0 ? "FREE" : money(order.shipping), {
    x: width - marginX - 60,
    y,
    size: 8.5,
    font: bold,
    color: order.shipping === 0 ? FOREST : INK,
  });

  // Grand Total
  y -= 18;
  page.drawLine({
    start: { x: totalsLeft - 10, y: y + 10 },
    end: { x: width - marginX, y: y + 10 },
    thickness: 1,
    color: GOLD,
  });
  page.drawText("Total Paid (INR)", { x: totalsLeft, y, size: 10, font: bold, color: WINE });
  page.drawText(money(order.total), { x: width - marginX - 70, y, size: 11, font: bold, color: WINE });

  // Boutique Verification Seal (Left Side)
  const sealY = y + 15;
  page.drawRectangle({
    x: marginX,
    y: sealY - 30,
    width: 220,
    height: 45,
    color: PAPER,
    borderColor: GOLD,
    borderWidth: 0.8,
  });
  page.drawText("✓ BOUTIQUE VERIFIED AUTHENTIC", {
    x: marginX + 12,
    y: sealY + 2,
    size: 8,
    font: bold,
    color: FOREST,
  });
  page.drawText("Curated Heirloom Silk & Handloom Drapes", {
    x: marginX + 12,
    y: sealY - 10,
    size: 7.5,
    font,
    color: SOFT,
  });
  page.drawText("Care: Dry clean exclusively · Store in muslin cloth", {
    x: marginX + 12,
    y: sealY - 21,
    size: 7,
    font,
    color: SOFT,
  });

  // 8. Footer
  page.drawLine({
    start: { x: marginX, y: 55 },
    end: { x: width - marginX, y: 55 },
    thickness: 0.5,
    color: LINE,
  });

  page.drawText(`Thank you for shopping with ${STORE_NAME}.`, {
    x: marginX,
    y: 40,
    size: 8.5,
    font: bold,
    color: INK,
  });
  page.drawText(
    `For any assistance, styling, or queries: Call / WhatsApp ${settings.displayPhone || "+91 91212 38445"} · Email: ${settings.supportEmail || "support@store.com"}`,
    {
      x: marginX,
      y: 28,
      size: 7.5,
      font,
      color: SOFT,
    }
  );

  return pdf.save();
}
