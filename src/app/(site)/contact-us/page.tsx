import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, PolicySection } from "@/components/policy-page";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Shravs Saree Collection. Contact our customer team via WhatsApp, phone, or email for order inquiries, sizing, and styling assistance.",
  alternates: {
    canonical: "/contact-us",
  },
};

export default function ContactUsPage() {
  return (
    <PolicyPage title="Contact Us" updated="20 September 2026">
      <PolicySection heading="Get in touch">
        <p>
          The fastest way to reach {STORE_NAME} is on WhatsApp - for order questions, sizing help,
          returns, or anything else.
        </p>
        {WHATSAPP_NUMBER && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal"
          >
            Chat with us on WhatsApp
          </a>
        )}
      </PolicySection>

      <PolicySection heading="Support hours">
        <p>Monday - Saturday, 10am - 7pm IST. Messages sent outside these hours are answered the next business day.</p>
      </PolicySection>

      <PolicySection heading="Business details">
        <p className="text-sm">
          {STORE_NAME}
          <br />
          [Add your registered business address]
          <br />
          Email: [Add your support email]
        </p>
      </PolicySection>

      <PolicySection heading="Other ways to reach us">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Track an existing order from{" "}
            <Link href="/orders/my" className="underline hover:text-signal">
              My Orders
            </Link>
            .
          </li>
          <li>
            Read our{" "}
            <Link href="/shipping-policy" className="underline hover:text-signal">
              Shipping
            </Link>{" "}
            and{" "}
            <Link href="/refund-policy" className="underline hover:text-signal">
              Refund
            </Link>{" "}
            policies for common order questions.
          </li>
        </ul>
      </PolicySection>
    </PolicyPage>
  );
}
