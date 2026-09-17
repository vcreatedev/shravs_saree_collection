import { Resend } from "resend";
import type { OrderWithItems } from "@/types";
import { formatPrice } from "./utils";
import { generateInvoicePdf } from "./invoice";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function orderEmailHtml(order: OrderWithItems): string {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.name}${
        item.color || item.size ? ` (${[item.color, item.size].filter(Boolean).join(", ")})` : ""
      }</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatPrice(
            item.price * item.quantity
          )}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17140f;">
      <h1 style="font-size:20px;margin-bottom:4px;">${STORE_NAME}</h1>
      <p style="color:#4a4438;margin-top:0;">Thank you for your order, ${order.customerName}!</p>
      <p style="color:#4a4438;">Order <strong>#${order.orderNumber}</strong> is confirmed. Your invoice is attached to this email.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        <thead>
          <tr>
            <th style="text-align:left;border-bottom:2px solid #17140f;padding-bottom:8px;">Item</th>
            <th style="text-align:center;border-bottom:2px solid #17140f;padding-bottom:8px;">Qty</th>
            <th style="text-align:right;border-bottom:2px solid #17140f;padding-bottom:8px;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="text-align:right;font-size:16px;font-weight:bold;margin-top:12px;">
        Total: ${formatPrice(order.total)}
      </p>
      <p style="color:#4a4438;font-size:13px;margin-top:24px;">
        Shipping to: ${order.address}, ${order.city}, ${order.state} ${order.pincode}
      </p>
      <p style="color:#8a8374;font-size:12px;margin-top:32px;">
        If you have any questions, just reply to this email.
      </p>
    </div>`;
}

export async function sendInvoiceEmail(order: OrderWithItems): Promise<{ sent: boolean; reason?: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const pdfBytes = await generateInvoicePdf(order);

    const result = await resend.emails.send({
      from: `${STORE_NAME} <${EMAIL_FROM}>`,
      to: [order.email],
      subject: `Your ${STORE_NAME} order #${order.orderNumber} is confirmed`,
      html: orderEmailHtml(order),
      attachments: [
        {
          filename: `invoice-${order.orderNumber}.pdf`,
          content: Buffer.from(pdfBytes),
        },
      ],
    });

    if (result.error) {
      console.error("sendInvoiceEmail: Resend returned an error", result.error);
      return { sent: false, reason: result.error.message };
    }

    return { sent: true };
  } catch (error) {
    console.error("sendInvoiceEmail failed", error);
    return { sent: false, reason: error instanceof Error ? error.message : "unknown error" };
  }
}
