import "server-only";
import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpayClient() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  });
}

function hmacMatches(payload: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  return expectedBuf.length === signatureBuf.length && crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/** Checks the signature Razorpay's checkout hands the browser after payment. */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  return hmacMatches(`${orderId}|${paymentId}`, signature, process.env.RAZORPAY_KEY_SECRET || "");
}

/** Checks a webhook call really comes from Razorpay: signed with the webhook
 * secret set in Razorpay's dashboard (RAZORPAY_WEBHOOK_SECRET). */
export function verifyRazorpayWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  return Boolean(secret) && hmacMatches(rawBody, signature, secret!);
}

/** How the customer paid - "upi", "card", "netbanking", "wallet" - or "" if
 * Razorpay can't be asked. */
export async function paymentMethodFor(paymentId: string): Promise<string> {
  try {
    const payment = await getRazorpayClient().payments.fetch(paymentId);
    return String(payment.method ?? "");
  } catch {
    return "";
  }
}
