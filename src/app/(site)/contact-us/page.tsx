import type { Metadata } from "next";
import { PageSections, PolicyPage, PolicySection, SectionText } from "@/components/policy-page";
import { getContactPage, getSiteSettings } from "@/lib/catalog";
import { buildWhatsAppLink, generalInquiryMessage } from "@/lib/whatsapp";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Shravs Saree Collection. Contact our customer team via WhatsApp, phone, or email for order inquiries, sizing, and styling assistance.",
  alternates: {
    canonical: "/contact-us",
  },
};

/* The page's words are edited in the Studio (Pages → Contact Us Page); the
   phone, email, location and hours come from Storefront Settings. */
export default async function ContactUsPage() {
  const [page, settings] = await Promise.all([getContactPage(), getSiteSettings()]);
  const link = "underline hover:text-signal";

  return (
    <PolicyPage title={page?.title || "Contact Us"} updated={page?.updatedDate}>
      <PolicySection heading="Get in touch">
        {page?.intro && <SectionText content={page.intro} />}
        <div className="flex flex-wrap items-center gap-4">
          <a
            href={buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage || generalInquiryMessage(settings.storeName))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal"
          >
            {page?.whatsappButtonText || "Chat with us on WhatsApp"}
          </a>
        </div>
        <p>
          Prefer to call or email? Phone{" "}
          <a href={settings.phoneLink} className={link}>
            {settings.displayPhone}
          </a>{" "}
          or write to{" "}
          <a href={`mailto:${settings.supportEmail}`} className={link}>
            {settings.supportEmail}
          </a>
          .
        </p>
      </PolicySection>

      <div className="my-8">
        <ContactForm />
      </div>

      <PolicySection heading="Support hours">
        <p>{settings.supportHours}. Messages sent outside these hours are answered the next business day.</p>
      </PolicySection>

      <PolicySection heading="Business details">
        <p className="text-sm">
          {settings.storeName}
          <br />
          {page?.mapsUrl ? (
            <a href={page.mapsUrl} target="_blank" rel="noopener noreferrer" className={link}>
              {settings.location}
            </a>
          ) : (
            settings.location
          )}
          <br />
          Phone: {settings.displayPhone}
          <br />
          Email: {settings.supportEmail}
        </p>
      </PolicySection>

      {page && <PageSections sections={page.sections} />}
    </PolicyPage>
  );
}
