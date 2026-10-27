import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection } from "@/components/policy-page";
import { STORE_EMAIL, WHATSAPP_NUMBER } from "@/lib/contact";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Review the privacy policy for Shravs Saree Collection. Understand how we collect, protect, and handle your personal data and payment security.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Privacy Policy" updated="20 September 2026">
      <p>
        {STORE_NAME} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy. This
        page explains what information we collect when you shop with us, why we collect it, and
        how it&apos;s handled.
      </p>

      <PolicySection heading="Information we collect">
        <p>When you browse or place an order, we collect:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Contact details you give us at checkout - name, email, phone number, and shipping address.</li>
          <li>Order details - items purchased, price paid, and order status.</li>
          <li>
            Basic usage information (like pages visited) that helps us keep the site fast and
            working correctly.
          </li>
        </ul>
        <p>
          We do not collect or store your card, UPI, or net-banking details. Payments are handled
          entirely by Razorpay, our payment gateway partner - see below.
        </p>
      </PolicySection>

      <PolicySection heading="How we use your information">
        <ul className="list-disc space-y-1 pl-5">
          <li>To process and deliver your order, and to keep you updated on its status.</li>
          <li>To respond to questions you send us, including over WhatsApp.</li>
          <li>To send your order invoice by email.</li>
          <li>To improve the site and prevent fraud or abuse.</li>
        </ul>
        <p>We do not sell your personal information to anyone.</p>
      </PolicySection>

      <PolicySection heading="Payments via Razorpay">
        <p>
          All payments on this site are processed by{" "}
          <a href="https://razorpay.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-signal">
            Razorpay
          </a>
          , a PCI-DSS compliant payment gateway. When you pay, your card/UPI/bank details go
          directly to Razorpay over an encrypted connection - they never pass through or get
          stored on our servers. Razorpay&apos;s own{" "}
          <a
            href="https://razorpay.com/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-signal"
          >
            privacy policy
          </a>{" "}
          governs how they handle that information.
        </p>
      </PolicySection>

      <PolicySection heading="Sharing with service providers">
        <p>We share only what&apos;s necessary with the providers who help us run this store:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Razorpay - to process your payment.</li>
          <li>Our shipping/courier partner - your name, address, and phone number, to deliver your order.</li>
          <li>Our email provider - to send order confirmations and invoices.</li>
        </ul>
        <p>We don&apos;t share your information with anyone else for marketing purposes.</p>
      </PolicySection>

      <PolicySection heading="Data security">
        <p>
          We use industry-standard measures (encrypted connections, access-controlled systems) to
          protect the information we hold. No online system is 100% risk-free, but we take
          reasonable steps to keep your data safe.
        </p>
      </PolicySection>

      <PolicySection heading="Your choices">
        <p>
          You can ask us to review, correct, or delete the personal information we hold about you
          by contacting us on WhatsApp or through our{" "}
          <Link href="/contact-us" className="underline hover:text-signal">
            Contact page
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection heading="Changes to this policy">
        <p>
          We may update this policy from time to time as the site or our practices change. The
          date at the top of this page shows when it was last revised.
        </p>
      </PolicySection>

      <PolicySection heading="Contact us">
        <p>
          Questions about this policy? Reach us on WhatsApp
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
          , Mon–Sat, 10am–7pm IST, or email us at{" "}
          <a href={`mailto:${STORE_EMAIL}`} className="underline hover:text-signal">
            {STORE_EMAIL}
          </a>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
