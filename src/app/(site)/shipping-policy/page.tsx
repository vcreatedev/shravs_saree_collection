import Link from "next/link";
import { PolicyPage, PolicySection } from "@/components/policy-page";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export const metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Shipping Policy" updated="20 September 2026">
      <PolicySection heading="Where we ship">
        <p>We currently ship across India. If you need delivery outside India, message us on WhatsApp and we&apos;ll see what we can do.</p>
      </PolicySection>

      <PolicySection heading="Shipping charges">
        <ul className="list-disc space-y-1 pl-5">
          <li>Free shipping on orders over ₹2,000.</li>
          <li>A flat shipping fee applies to orders below that, shown at checkout before you pay.</li>
        </ul>
      </PolicySection>

      <PolicySection heading="Processing time">
        <p>
          Orders are handpicked and packed within 1-2 business days of payment confirmation.
          During sale periods or for made-to-order pieces, packing may take a little longer - we&apos;ll
          let you know if that&apos;s the case.
        </p>
      </PolicySection>

      <PolicySection heading="Delivery timelines">
        <p>Once shipped, typical delivery times are:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Metro cities: 3-5 business days.</li>
          <li>Rest of India: 5-8 business days.</li>
        </ul>
        <p>
          These are estimates from our courier partners, not guarantees - remote locations or
          weather/logistics disruptions can occasionally add a few days.
        </p>
      </PolicySection>

      <PolicySection heading="Tracking your order">
        <p>
          You&apos;ll get a shipping confirmation once your order leaves our hands, and you can check
          its status anytime from{" "}
          <Link href="/orders/my" className="underline hover:text-signal">
            My Orders
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection heading="Contact us">
        <p>
          Order taking longer than expected? Message us on WhatsApp
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
          with your order number and we&apos;ll look into it.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
