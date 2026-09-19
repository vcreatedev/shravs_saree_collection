import Link from "next/link";
import { PolicyPage, PolicySection } from "@/components/policy-page";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <PolicyPage title="Terms &amp; Conditions" updated="20 September 2026">
      <p>
        These terms govern your use of {STORE_NAME} and any purchase you make with us. By placing
        an order, you agree to them.
      </p>

      <PolicySection heading="About us">
        <p>
          {STORE_NAME} is a boutique selling handpicked sarees, gowns, and related pieces online.
          Every order is packed by hand and shipped with care.
        </p>
      </PolicySection>

      <PolicySection heading="Products, pricing &amp; availability">
        <ul className="list-disc space-y-1 pl-5">
          <li>We describe and photograph products as accurately as we can; minor color variation from screen to screen is possible.</li>
          <li>Prices are listed in Indian Rupees (₹) and include applicable taxes unless stated otherwise.</li>
          <li>We reserve the right to correct pricing errors and to limit quantities on any item.</li>
          <li>Stock is confirmed only once your order is placed and payment is successful - listing a product doesn&apos;t guarantee availability.</li>
        </ul>
      </PolicySection>

      <PolicySection heading="Orders &amp; payment">
        <p>
          Placing an order is an offer to buy; we accept it once payment is confirmed. All
          payments are processed securely through Razorpay - we accept major cards, UPI, net
          banking, and wallets supported by Razorpay. We do not store your payment details.
        </p>
      </PolicySection>

      <PolicySection heading="Shipping, returns &amp; refunds">
        <p>
          See our{" "}
          <Link href="/shipping-policy" className="underline hover:text-signal">
            Shipping Policy
          </Link>{" "}
          and{" "}
          <Link href="/refund-policy" className="underline hover:text-signal">
            Refund &amp; Cancellation Policy
          </Link>{" "}
          for full details on delivery timelines, returns, and refunds.
        </p>
      </PolicySection>

      <PolicySection heading="Intellectual property">
        <p>
          All text, photography, and design on this site belong to {STORE_NAME} unless otherwise
          noted, and may not be reused without our permission.
        </p>
      </PolicySection>

      <PolicySection heading="Limitation of liability">
        <p>
          We aren&apos;t liable for indirect or consequential losses arising from your use of this
          site or your purchase, beyond the value of the order itself, except where such
          limitation isn&apos;t permitted by law.
        </p>
      </PolicySection>

      <PolicySection heading="Governing law">
        <p>These terms are governed by the laws of India, and disputes are subject to the jurisdiction of the courts where {STORE_NAME} is registered.</p>
      </PolicySection>

      <PolicySection heading="Changes to these terms">
        <p>We may update these terms occasionally. Continued use of the site after a change means you accept the updated terms.</p>
      </PolicySection>

      <PolicySection heading="Contact us">
        <p>
          Questions about these terms? Reach us on WhatsApp
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
          )}
          , Mon–Sat, 10am–7pm IST.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
