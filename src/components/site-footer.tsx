import Link from "next/link";
import Image from "next/image";
import { Truck, Award, ShieldCheck, RotateCcw, MessageCircle, Mail, Phone, MapPin, Clock, ChevronDown } from "lucide-react";
import { STORE_EMAIL, STORE_LOCATION, STORE_PHONE, STORE_PHONE_LINK, WHATSAPP_NUMBER } from "@/lib/contact";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";
const ABOUT = "Small-batch, thoughtfully sourced goods. Every order is packed by hand and shipped with care.";

const QUICK_LINKS = [
  { href: "/shop", label: "Collections" },
  { href: "/shop?tag=new", label: "New Arrivals" },
  { href: "/shop?sort=rating", label: "Best Sellers" },
  { href: "/orders/track", label: "Track Order" },
  { href: "/contact-us", label: "Contact" },
];

const POLICY_LINKS = [
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/refund-policy", label: "Returns & Refunds" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms and Conditions" },
];

// Each line matches what the policy pages themselves promise.
const TRUST_ITEMS = [
  { icon: Truck, title: "Free Shipping", body: "Over ₹2,000" },
  { icon: Award, title: "Premium Quality", body: "Handpicked" },
  { icon: ShieldCheck, title: "Secure Payment", body: "Razorpay" },
  { icon: RotateCcw, title: "Easy Returns", body: "Within 7 days" },
];

const LINK_CLASS = "text-xs text-band-soft transition-colors hover:text-band-accent";

function LinkList({ links }: { links: { href: string; label: string }[] }) {
  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={LINK_CLASS}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ContactList() {
  return (
    <div className="space-y-2 text-xs text-band-soft">
      {WHATSAPP_NUMBER && (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-colors hover:text-band-accent"
        >
          <MessageCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          WhatsApp us
        </a>
      )}
      <a href={STORE_PHONE_LINK} className="flex items-center gap-2 transition-colors hover:text-band-accent">
        <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        {STORE_PHONE}
      </a>
      <a
        href={`mailto:${STORE_EMAIL}`}
        className="flex items-center gap-2 break-all transition-colors hover:text-band-accent"
      >
        <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        {STORE_EMAIL}
      </a>
      <p className="flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        {STORE_LOCATION}
      </p>
      <p className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        Mon–Sat, 10am–7pm IST
      </p>
    </div>
  );
}

const SECTIONS = [
  { title: "Quick Links", body: <LinkList links={QUICK_LINKS} /> },
  { title: "Customer Info", body: <LinkList links={POLICY_LINKS} /> },
  { title: "Contact Info", body: <ContactList /> },
];

function Logo({ size }: { size: string }) {
  return (
    <span className={`relative mb-3 block overflow-hidden rounded-full ring-1 ring-gold/70 ${size}`}>
      <Image src="/logo.jpg" alt={STORE_NAME} fill sizes="64px" className="object-cover" />
    </span>
  );
}

export function SiteFooter() {
  return (
    // The bottom padding keeps the last line clear of the phone tab bar.
    <footer className="w-full border-t border-gold/40 bg-band pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-band-fg lg:pb-6">
      <div className="w-full px-3 py-5 sm:px-4 lg:px-5 lg:py-6">
        <div className="hidden items-start justify-between gap-10 lg:flex">
          <div className="max-w-[280px] flex-shrink-0">
            <Logo size="h-16 w-16" />
            <p className="text-xs leading-relaxed text-band-soft">{ABOUT}</p>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-8">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="mb-3 text-sm font-semibold">{section.title}</h3>
                {section.body}
              </div>
            ))}
          </div>
        </div>

        {/* Phones and tablets: centred brand, then collapsible link groups -
            native <details>, so they open and close without any JavaScript. */}
        <div className="lg:hidden">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo size="h-14 w-14" />
            <p className="max-w-[280px] text-xs leading-relaxed text-band-soft">{ABOUT}</p>
          </div>
          <div className="border-t border-band-line">
            {SECTIONS.map((section) => (
              <details key={section.title} className="group border-b border-band-line">
                <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  {section.title}
                  <ChevronDown className="h-4 w-4 text-gold transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="pb-4">{section.body}</div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-band-line pt-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-2">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center sm:px-1">
                <item.icon className="mb-1.5 h-5 w-5 text-gold" strokeWidth={1.5} />
                <span className="text-[11px] font-medium">{item.title}</span>
                <span className="text-[10px] text-band-soft">{item.body}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 border-t border-band-line px-2 pt-5 text-center text-[11px] leading-relaxed text-band-soft sm:text-xs">
          © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
