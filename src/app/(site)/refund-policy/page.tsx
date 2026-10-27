import type { Metadata } from "next";
import { PolicyPage, PolicySection } from "@/components/policy-page";
import { STORE_EMAIL, WHATSAPP_NUMBER } from "@/lib/contact";


export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Read our clear 7-day return and refund policy at Shravs Saree Collection. Hassle-free cancellations, simple returns, and transparent timelines.",
  alternates: {
    canonical: "/refund-policy",
  },
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage title="Refund &amp; Cancellation Policy" updated="20 September 2026">
      <PolicySection heading="Order cancellation">
        <p>
          You can cancel an order for free any time before it ships - message us on WhatsApp with
          your order number and we&apos;ll cancel it and refund the full amount. Once an order has
          shipped, it can no longer be cancelled, but you may still be eligible to return it (see
          below).
        </p>
      </PolicySection>

      <PolicySection heading="7-day returns">
        <p>
          We offer easy returns within <strong>7 days of delivery</strong>. To be eligible, the
          item must be:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Unused, unworn, and unwashed.</li>
          <li>In its original condition with all tags attached.</li>
          <li>Returned in its original packaging where possible.</li>
        </ul>
        <p>
          Blouse pieces cut/stitched to order, and items marked &quot;final sale&quot; at the time
          of purchase, are not eligible for return.
        </p>
      </PolicySection>

      <PolicySection heading="How to start a return">
        <p>
          Message us on WhatsApp
          {WHATSAPP_NUMBER && (
            <>
              {" "}
              at{" "}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-signal"
              >
                +{WHATSAPP_NUMBER}
              </a>
            </>
          )}{" "}
          with your order number and the reason for return. We&apos;ll confirm eligibility and
          arrange a pickup or share a return address, whichever is easier for your location.
        </p>
      </PolicySection>

      <PolicySection heading="Damaged or incorrect items">
        <p>
          If an item arrives damaged, defective, or different from what you ordered, let us know
          within 48 hours of delivery with photos - we&apos;ll arrange a free replacement or a full
          refund, no questions asked.
        </p>
      </PolicySection>

      <PolicySection heading="Refund timeline">
        <p>
          Once we&apos;ve received and inspected a returned item, refunds are processed back to
          your original payment method through Razorpay within 5-7 business days. Depending on
          your bank, it may take a few additional days to reflect in your account.
        </p>
      </PolicySection>

      <PolicySection heading="Contact us">
        <p>
          Any questions about a return or refund - reach us on WhatsApp or email us at{" "}
          <a href={`mailto:${STORE_EMAIL}`} className="underline hover:text-signal">
            {STORE_EMAIL}
          </a>
          , Mon–Sat, 10am–7pm IST, and we&apos;ll sort it out.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
