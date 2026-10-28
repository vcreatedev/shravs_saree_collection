import "server-only";
import { Resend } from "resend";
import type { Order } from "@/types";
import { formatPrice } from "./utils";
import { generateInvoicePdf } from "./invoice";
import type { SiteSettings } from "./catalog";

/* Order emails through Resend: the customer's luxury confirmation (with the
   invoice PDF attached), cancellation/refund notice, an alert to the store's
   own inbox for each paid order, contact inquiries, and the customer's delivery updates. */

const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

const WINE = "#64132f";
const BURGUNDY = "#8b1645";
const GOLD = "#c99a3b";
const INK = "#1f110a";
const SOFT = "#7d5d36";
const LINE = "#e8dfd5";
const CREAM = "#fff8ec";
const FOREST = "#15803d";

type SendResult = { sent: boolean; reason?: string; id?: string };

function getResendClient(): Resend | null {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

const escape = (value: string) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const orderUrl = (order: Order) => (SITE_URL ? `${SITE_URL}/orders/${order.id}` : "");

async function send(
  settings: SiteSettings,
  message: { to: string; subject: string; html: string; attachments?: { filename: string; content: Buffer }[] }
): Promise<SendResult> {
  const resend = getResendClient();
  if (!resend) return { sent: false, reason: "RESEND_API_KEY not configured" };
  try {
    const result = await resend.emails.send({
      from: `${settings.storeName} <${EMAIL_FROM}>`,
      to: [message.to],
      replyTo: settings.supportEmail,
      subject: message.subject,
      html: message.html,
      attachments: message.attachments,
    });
    if (result.error) return { sent: false, reason: result.error.message };
    return { sent: true, id: result.data?.id };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "unknown error" };
  }
}

/** The customer's order confirmation, styled in boutique luxury with the invoice PDF attached. */
export async function sendOrderConfirmation(order: Order, settings: SiteSettings): Promise<SendResult> {
  const pdf = await generateInvoicePdf(order, settings);
  const a = order.shippingAddress;
  const storeName = settings.storeName || "Shravs Saree Collection";

  const orderDateFormatted = new Date(order.createdAt || Date.now()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }) + " IST";

  // Build items list for WhatsApp pre-filled concierge message
  const itemsListText = (order.items || [])
    .map((item) => {
      const code = item.code ? ` [Code: ${item.code}]` : "";
      const variant = [item.color, item.size].filter(Boolean).join(", ");
      const varText = variant ? ` (${variant})` : "";
      const pLink = item.slug ? `${SITE_URL}/product/${item.slug}` : "";
      return `• ${item.name}${code}${varText} x ${item.quantity} — ${formatPrice(item.price * item.quantity)}${pLink ? `\n  Drape Link: ${pLink}` : ""}`;
    })
    .join("\n");

  const rawWaMessage =
    `Hello ${storeName} Team, I would like an update on my order.\n\n` +
    `📦 Order ID: #${order.orderNumber}\n` +
    `💳 Payment ID: ${order.payment?.razorpayPaymentId || "Verified"}\n` +
    `👤 Customer: ${order.customer.name} (${order.customer.phone})\n` +
    `📍 Delivery: ${a.address}, ${a.city}, ${a.state} - ${a.pincode}\n\n` +
    `👗 Ordered Drapes:\n${itemsListText}\n\n` +
    `💰 Total Amount Paid: ${formatPrice(order.total)}\n\n` +
    `Could you please share the current dispatch / delivery status? Thank you!`;

  const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(rawWaMessage)}`;

  const itemsHtml = (order.items || [])
    .map((item) => {
      const shareUrl = item.slug ? `${SITE_URL}/product/${item.slug}` : orderUrl(order);
      const variantInfo = [item.color ? `Color: ${escape(item.color)}` : "", item.size ? `Size: ${escape(item.size)}` : ""].filter(Boolean).join(" · ");

      return `
        <tr style="border-bottom: 1px solid ${LINE};">
          <td style="padding: 14px 14px 14px 0; vertical-align: top; width: 68px;">
            <a href="${shareUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block;">
              <div style="width: 68px; height: 88px; border-radius: 6px; overflow: hidden; border: 1.5px solid ${LINE}; background-color: ${CREAM};">
                ${
                  item.image
                    ? `<img src="${item.image}" alt="${escape(item.name)}" width="68" height="88" style="display: block; width: 68px; height: 88px; object-fit: cover; border-radius: 5px;" />`
                    : `<div style="width: 68px; height: 88px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: ${SOFT}; text-align: center;">Drape</div>`
                }
              </div>
            </a>
          </td>
          <td style="padding: 14px 0; vertical-align: top;">
            <p style="margin: 0 0 5px; font-weight: 700; color: ${INK}; font-size: 14.5px; font-family: Georgia, serif; line-height: 1.35;">
              <a href="${shareUrl}" target="_blank" rel="noopener noreferrer" style="color: ${INK}; text-decoration: none;">
                ${escape(item.name)}
              </a>
            </p>
            <div style="margin-bottom: 6px;">
              ${
                item.code
                  ? `<span style="display: inline-block; background: rgba(201, 169, 106, 0.16); color: ${WINE}; border: 1px solid rgba(201, 169, 106, 0.45); padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.04em;">CODE: ${escape(item.code)}</span>`
                  : ""
              }
              ${
                variantInfo
                  ? `<span style="display: inline-block; background: #fff8ec; padding: 2px 7px; border-radius: 4px; border: 1px solid ${LINE}; font-size: 10px; color: ${SOFT}; font-weight: 600; margin-left: 5px;">${variantInfo}</span>`
                  : ""
              }
            </div>
            <div style="font-size: 12px; color: ${SOFT};">
              Quantity: <strong style="color: ${INK};">${item.quantity}</strong> &nbsp;·&nbsp;
              Price: <strong style="color: ${BURGUNDY};">${formatPrice(item.price * item.quantity)}</strong>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmed - ${escape(storeName)}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4ef; margin: 0; padding: 24px 12px; color: ${INK}; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid ${LINE}; box-shadow: 0 8px 28px rgba(31, 17, 10, 0.08);">
        
        <!-- Brand Header with Logo -->
        <tr>
          <td style="background: linear-gradient(180deg, #3d071b 0%, ${WINE} 100%); padding: 30px 20px 24px; text-align: center; border-bottom: 3px solid ${GOLD};">
            ${
              settings.logo
                ? `<div style="margin-bottom: 10px;">
                    <img src="${settings.logo}" alt="${escape(storeName)}" width="92" height="92" style="display: inline-block; border-radius: 50%; box-shadow: 0 6px 18px rgba(0,0,0,0.4); border: 2px solid ${GOLD}; background-color: ${CREAM}; object-fit: cover;" />
                   </div>`
                : ""
            }
            <h1 style="color: ${CREAM}; margin: 0 0 4px; font-size: 22px; font-weight: 800; letter-spacing: 0.12em; font-family: Georgia, serif;">
              ${escape(storeName)}
            </h1>
            <p style="color: ${GOLD}; margin: 0 0 6px; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 700;">
              Handpicked Sarees · Woven with a Story
            </p>
          </td>
        </tr>

        <!-- Main Content -->
        <tr>
          <td style="padding: 26px 24px 20px;">
            
            <!-- Greeting & Status -->
            <div style="text-align: center; margin-bottom: 22px;">
              <span style="display: inline-block; background-color: #eaf6ed; color: ${FOREST}; padding: 5px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid #c4e6cb; margin-bottom: 10px;">
                &#10003; Payment Confirmed &bull; Order Received
              </span>
              <h2 style="color: ${INK}; margin: 0 0 8px; font-size: 20px; font-family: Georgia, serif; font-weight: 700;">
                Namaste ${escape(order.customer.name || "Valued Patron")},
              </h2>
              <p style="color: ${SOFT}; line-height: 1.55; margin: 0 auto; font-size: 14px; max-width: 480px;">
                Thank you for shopping with <strong>${escape(storeName)}</strong>. Your payment has been securely captured, and our boutique is preparing your heirloom drape for insured dispatch.
              </p>
            </div>

            <!-- Attached Official Invoice Notification Box -->
            <div style="background-color: ${CREAM}; border: 1px solid ${LINE}; border-left: 4px solid ${GOLD}; border-radius: 8px; padding: 13px 16px; margin-bottom: 22px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 28px; vertical-align: middle; font-size: 20px; line-height: 1;">
                    &#128196;
                  </td>
                  <td style="vertical-align: middle; padding-left: 6px;">
                    <strong style="color: ${INK}; font-size: 13.5px; display: block; margin-bottom: 2px;">
                      Official Invoice Attached (PDF)
                    </strong>
                    <span style="font-size: 12px; color: ${SOFT}; line-height: 1.45; display: block;">
                      Your complete invoice with full itemized breakdown, boutique verification seal, and payment proof is attached: <strong>Invoice-${order.orderNumber}.pdf</strong>
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Order Reference Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf7f2; border: 1px solid ${LINE}; border-radius: 8px; margin-bottom: 22px; overflow: hidden;">
              <tr>
                <td style="padding: 13px 16px; border-right: 1px solid ${LINE}; width: 50%; vertical-align: top;">
                  <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: ${GOLD}; display: block; margin-bottom: 4px; font-weight: 700;">
                    Order Reference
                  </span>
                  <strong style="color: ${INK}; font-size: 14px; word-break: break-all; font-family: monospace, sans-serif;">
                    #${order.orderNumber}
                  </strong>
                </td>
                <td style="padding: 13px 16px; width: 50%; vertical-align: top;">
                  <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: ${GOLD}; display: block; margin-bottom: 4px; font-weight: 700;">
                    Razorpay Payment ID
                  </span>
                  <strong style="color: ${BURGUNDY}; font-size: 13.5px; word-break: break-all; font-family: monospace, sans-serif;">
                    ${order.payment?.razorpayPaymentId || "Verified"}
                  </strong>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px 16px; border-top: 1px solid ${LINE}; background-color: #f3eee6; font-size: 12px; color: ${INK};">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td><strong>Amount Paid:</strong> ${formatPrice(order.total)}</td>
                      <td style="text-align: right; color: ${SOFT}; font-size: 11px;">${orderDateFormatted}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Ordered Items Header -->
            <div style="border-bottom: 2px solid ${WINE}; padding-bottom: 6px; margin-bottom: 12px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 10px; color: ${GOLD}; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700; display: block;">The Shravs Signature</span>
                    <h3 style="color: ${INK}; margin: 2px 0 0; font-size: 16px; font-weight: 700; font-family: Georgia, serif;">
                      Ordered Drapes
                    </h3>
                  </td>
                  <td style="text-align: right; color: ${SOFT}; font-size: 12px; font-weight: 600; vertical-align: bottom;">
                    ${order.items.length} item${order.items.length > 1 ? "s" : ""}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Ordered Items List -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
              ${itemsHtml}
            </table>

            <!-- Delivery Destination Summary -->
            <div style="background-color: #faf7f2; border: 1px solid ${LINE}; border-radius: 8px; padding: 14px 16px; margin-bottom: 22px;">
              <span style="font-size: 10px; color: ${GOLD}; text-transform: uppercase; letter-spacing: 0.16em; font-weight: 700; display: block; margin-bottom: 4px;">Delivering To</span>
              <p style="margin: 0 0 4px; line-height: 1.5; color: ${INK}; font-size: 13px;">
                <strong>${escape(order.customer.name)}</strong> &bull; ${escape(a.address)}, ${escape(a.city)}, ${escape(a.state)} &ndash; ${escape(a.pincode)}
              </p>
              <p style="margin: 0; font-size: 11.5px; color: ${SOFT};">
                Contact Phone: <strong>${escape(order.customer.phone)}</strong>
              </p>
            </div>

            <!-- WhatsApp Concierge Support -->
            <div style="background: linear-gradient(180deg, #f0fdf4 0%, #e6f8ed 100%); border: 1.5px solid #a4e2b8; border-radius: 10px; padding: 18px 16px; text-align: center; margin-bottom: 18px;">
              <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: ${FOREST}; font-weight: 700;">
                Personal Concierge &bull; Live Assistance
              </p>
              <p style="margin: 0 0 14px; font-size: 13px; color: #166534; line-height: 1.45;">
                Need styling advice, priority dispatch, or delivery queries? Chat directly with our Hyderabad team.
              </p>
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 11px 24px; border-radius: 24px; box-shadow: 0 4px 12px rgba(37,211,102,0.3);">
                &#128172; Chat on WhatsApp Regarding Order #${order.orderNumber}
              </a>
            </div>

            <!-- Track Order Link Button -->
            ${
              orderUrl(order)
                ? `<div style="text-align: center; margin-bottom: 10px;">
                    <a href="${orderUrl(order)}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: ${WINE}; color: ${CREAM}; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 24px;">
                      Track Your Order Status &rarr;
                    </a>
                   </div>`
                : ""
            }

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f7f4ef; padding: 22px 20px; text-align: center; border-top: 1px solid ${LINE}; font-size: 12px; color: ${SOFT}; line-height: 1.6;">
            <p style="margin: 0 0 6px; font-weight: 600; color: ${INK};">
              ${escape(storeName)}
            </p>
            <p style="margin: 0 0 6px;">
              ${escape(settings.location || "Hyderabad, Telangana, India")} &bull; ${escape(settings.displayPhone || "+91 91212 38445")} &bull; <a href="mailto:${escape(settings.supportEmail || "support@store.com")}" style="color: ${BURGUNDY}; text-decoration: none;">${escape(settings.supportEmail || "support@store.com")}</a>
            </p>
            <p style="margin: 0; font-size: 11px; opacity: 0.85;">
              Woven with love, tradition, and artistry. &copy; ${new Date().getFullYear()} ${escape(storeName)}. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </body>
    </html>
  `;

  return send(settings, {
    to: order.customer.email,
    subject: `Order Confirmed #${order.orderNumber} · ${escape(storeName)}`,
    html: emailHtml,
    attachments: [{ filename: `Invoice-${order.orderNumber}.pdf`, content: Buffer.from(pdf) }],
  });
}

/** Tells the store a new order has been paid, with items, customer details, and Studio link. */
export async function sendStoreOrderAlert(order: Order, settings: SiteSettings): Promise<SendResult> {
  const a = order.shippingAddress;
  const storeName = settings.storeName || "Shravs Saree Collection";

  const rows = order.items
    .map((item) => {
      const options = [item.color, item.size].filter(Boolean).join(", ");
      return `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid ${LINE}; font-size: 13px;">${escape(item.name)}${item.code ? ` [${escape(item.code)}]` : ""}${options ? ` (${escape(options)})` : ""}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid ${LINE}; text-align: center; font-size: 13px;">${item.quantity}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid ${LINE}; text-align: right; font-size: 13px;">${formatPrice(item.price * item.quantity)}</td>
        </tr>`;
    })
    .join("");

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: ${INK}; background: #ffffff; padding: 24px; border: 1px solid ${LINE}; border-radius: 8px;">
      <h2 style="color: ${WINE}; margin-top: 0; font-size: 20px;">🎉 New Paid Order #${order.orderNumber}</h2>
      <p style="font-size: 14px; color: ${SOFT};">A customer just completed payment for an order on ${escape(storeName)}.</p>
      
      <div style="background: #faf7f2; border: 1px solid ${LINE}; border-radius: 6px; padding: 14px; margin: 16px 0;">
        <p style="margin: 0 0 6px; font-weight: bold; font-size: 14px; color: ${INK};">${escape(order.customer.name)}</p>
        <p style="margin: 0 0 4px; font-size: 13px; color: ${SOFT};">Phone: <strong>${escape(order.customer.phone)}</strong> · Email: ${escape(order.customer.email)}</p>
        <p style="margin: 0; font-size: 13px; color: ${SOFT};">Address: ${escape(a.address)}, ${escape(a.city)}, ${escape(a.state)} - ${escape(a.pincode)}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <thead>
          <tr style="border-bottom: 2px solid ${WINE};">
            <th style="text-align: left; padding-bottom: 6px; font-size: 12px; color: ${WINE};">ITEM</th>
            <th style="text-align: center; padding-bottom: 6px; font-size: 12px; color: ${WINE};">QTY</th>
            <th style="text-align: right; padding-bottom: 6px; font-size: 12px; color: ${WINE};">TOTAL</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="text-align: right; font-size: 13px; margin: 10px 0 0; color: ${SOFT};">Shipping: ${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</p>
      <p style="text-align: right; font-size: 16px; font-weight: bold; margin: 4px 0 0; color: ${WINE};">Total Paid: ${formatPrice(order.total)}</p>

      <div style="margin-top: 28px; text-align: center;">
        <a href="${SITE_URL}/admin" style="background: ${WINE}; color: ${CREAM}; padding: 12px 24px; border-radius: 20px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
          Open Orders in Studio (/admin) &rarr;
        </a>
      </div>
    </div>
  `;

  return send(settings, {
    to: settings.supportEmail,
    subject: `New Paid Order #${order.orderNumber} · ${formatPrice(order.total)} · ${order.customer.name}`,
    html: emailHtml,
  });
}

/** Sends an apology cancellation and refund notice when an order is cancelled or rejected (e.g. out of stock). */
export async function sendOrderCancelledEmail(order: Order, settings: SiteSettings, reason?: string): Promise<SendResult> {
  const storeName = settings.storeName || "Shravs Saree Collection";
  const customReason = reason || "inventory constraints";

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: ${INK}; background: #ffffff; padding: 28px; border: 1px solid ${LINE}; border-radius: 8px;">
      <h2 style="color: ${BURGUNDY}; margin-top: 0; font-size: 20px;">Order Cancellation & 100% Refund Notice</h2>
      <p style="font-size: 14px; color: ${INK};">Namaste ${escape(order.customer.name || "Valued Patron")},</p>
      <p style="font-size: 14px; line-height: 1.6; color: ${SOFT};">
        We sincerely regret to inform you that we are unable to fulfill your order <strong>#${order.orderNumber}</strong> due to ${escape(customReason)}.
      </p>
      
      <div style="background-color: #fbf5f5; border: 1px solid #f0d0d0; border-left: 4px solid #c0392b; border-radius: 6px; padding: 14px 16px; margin: 20px 0;">
        <strong style="color: #c0392b; font-size: 14px; display: block; margin-bottom: 4px;">100% Full Refund Initiated</strong>
        <p style="margin: 0; font-size: 13px; color: #5a201c; line-height: 1.5;">
          A full refund of <strong>${formatPrice(order.total)}</strong> has been initiated to your original payment method via Razorpay. It typically reflects in your bank account or card within 5 to 7 business days.
        </p>
      </div>

      <p style="font-size: 13.5px; color: ${SOFT}; line-height: 1.6;">
        We deeply apologize for this inconvenience. If you would like assistance selecting an alternative handloom drape, our boutique team is at your service.
      </p>

      <div style="margin-top: 24px; text-align: center;">
        <a href="https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hello ${storeName}, I have a query regarding cancelled order #${order.orderNumber}`)}" style="background-color: #25D366; color: #ffffff; padding: 11px 22px; border-radius: 20px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
          &#128172; Contact Support on WhatsApp
        </a>
      </div>

      <p style="font-size: 12px; color: ${SOFT}; margin-top: 32px; border-top: 1px solid ${LINE}; padding-top: 14px; text-align: center;">
        ${escape(storeName)} · Care: ${escape(settings.supportEmail)} · ${escape(settings.displayPhone)}
      </p>
    </div>
  `;

  return send(settings, {
    to: order.customer.email,
    subject: `Order Cancellation & Full Refund Notice #${order.orderNumber} · ${escape(storeName)}`,
    html: emailHtml,
  });
}

/** Dispatches contact inquiries submitted on the /contact-us page. */
export async function sendContactInquiryEmail(
  inquiry: { name: string; email: string; phone?: string; subject: string; message: string },
  settings: SiteSettings
): Promise<SendResult> {
  const storeName = settings.storeName || "Shravs Saree Collection";

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: ${INK}; background: #ffffff; padding: 24px; border: 1px solid ${LINE}; border-radius: 8px;">
      <h2 style="color: ${WINE}; margin-top: 0; font-size: 18px;">📩 New Customer Inquiry · ${escape(storeName)}</h2>
      <div style="background: #faf7f2; border: 1px solid ${LINE}; border-radius: 6px; padding: 14px; margin: 16px 0;">
        <p style="margin: 0 0 6px; font-weight: bold; font-size: 14px; color: ${INK};">${escape(inquiry.name)}</p>
        <p style="margin: 0 0 4px; font-size: 13px; color: ${SOFT};">Email: <a href="mailto:${escape(inquiry.email)}" style="color: ${BURGUNDY};">${escape(inquiry.email)}</a></p>
        ${inquiry.phone ? `<p style="margin: 0 0 4px; font-size: 13px; color: ${SOFT};">Phone: <strong>${escape(inquiry.phone)}</strong></p>` : ""}
        <p style="margin: 0; font-size: 13px; color: ${SOFT};">Subject: <strong>${escape(inquiry.subject)}</strong></p>
      </div>
      <p style="font-size: 13px; color: ${GOLD}; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">Message:</p>
      <div style="background: #ffffff; border: 1px solid ${LINE}; border-radius: 6px; padding: 14px; font-size: 14px; line-height: 1.6; color: ${INK}; white-space: pre-wrap;">${escape(inquiry.message)}</div>
      <p style="font-size: 12px; color: ${SOFT}; margin-top: 20px;">You can reply directly to this email to respond to ${escape(inquiry.name)}.</p>
    </div>
  `;

  return send(settings, {
    to: settings.supportEmail,
    subject: `Customer Inquiry: ${escape(inquiry.subject)} · ${escape(inquiry.name)}`,
    html: emailHtml,
  });
}

export type DeliveryEmail = "shipped" | "outForDelivery" | "delivered";

const DELIVERY_COPY: Record<DeliveryEmail, { subject: (n: string) => string; heading: string; body: string }> = {
  shipped: {
    subject: (n) => `Your order #${n} has shipped · On its way to you`,
    heading: "Your drape has been dispatched!",
    body: "Your parcel is with our courier partner and on its way to your destination. You can track its live journey using the tracking details below.",
  },
  outForDelivery: {
    subject: (n) => `Your order #${n} is out for delivery today`,
    heading: "Arriving Today",
    body: "Your order is out for delivery and will reach you today. Please keep your phone handy for courier coordination.",
  },
  delivered: {
    subject: (n) => `Your order #${n} has been delivered · Thank you`,
    heading: "Delivered with Care",
    body: "Your order has been safely delivered. We hope you cherish draping your handpicked heirloom piece as much as we loved curating it for you.",
  },
};

/** A delivery update for the customer: shipped, out for delivery, delivered. */
export async function sendDeliveryEmail(order: Order, kind: DeliveryEmail, settings: SiteSettings): Promise<SendResult> {
  const copy = DELIVERY_COPY[kind];
  const s = order.shipment;
  const storeName = settings.storeName || "Shravs Saree Collection";

  const trackingHtml = s?.awb
    ? `
      <div style="background-color: #faf7f2; border: 1px solid ${LINE}; border-radius: 8px; padding: 14px 16px; margin: 18px 0;">
        <p style="margin: 0 0 6px; font-size: 13px; color: ${INK};">
          Courier Partner: <strong>${escape(s.courierName || "Insured Express Delivery")}</strong>
        </p>
        <p style="margin: 0 0 6px; font-size: 13px; color: ${INK};">
          Tracking Number (AWB): <strong style="font-family: monospace; color: ${BURGUNDY};">${escape(s.awb)}</strong>
        </p>
        ${s.etd && kind === "shipped" ? `<p style="margin: 0; font-size: 12px; color: ${SOFT};">Estimated Delivery: <strong>${escape(s.etd)}</strong></p>` : ""}
      </div>
    `
    : "";

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: ${INK}; background: #ffffff; padding: 28px; border: 1px solid ${LINE}; border-radius: 8px;">
      <h2 style="color: ${WINE}; margin-top: 0; font-size: 20px; font-family: Georgia, serif;">${copy.heading}</h2>
      <p style="font-size: 14px; color: ${INK};">Namaste ${escape(order.customer.name || "Valued Patron")},</p>
      <p style="font-size: 14px; line-height: 1.6; color: ${SOFT};">${copy.body}</p>
      
      <p style="font-size: 13px; color: ${SOFT}; margin-top: 14px;">Order Reference: <strong style="color: ${INK};">#${order.orderNumber}</strong></p>
      ${trackingHtml}

      <div style="margin-top: 26px; text-align: center;">
        <a href="${s?.trackingUrl || orderUrl(order)}" target="_blank" rel="noopener noreferrer" style="background: ${WINE}; color: ${CREAM}; padding: 12px 26px; border-radius: 20px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
          ${kind !== "delivered" ? "Track Your Parcel with Courier &rarr;" : "View Your Order Summary &rarr;"}
        </a>
      </div>

      <p style="font-size: 12px; color: ${SOFT}; margin-top: 32px; border-top: 1px solid ${LINE}; padding-top: 14px; text-align: center;">
        ${escape(storeName)} · For assistance: Call/WhatsApp ${escape(settings.displayPhone)} · <a href="mailto:${escape(settings.supportEmail)}" style="color: ${BURGUNDY};">${escape(settings.supportEmail)}</a>
      </p>
    </div>
  `;

  return send(settings, {
    to: order.customer.email,
    subject: copy.subject(order.orderNumber),
    html: emailHtml,
  });
}
