import Link from "next/link";
import Image from "next/image";
import {
  Truck,
  Award,
  ShieldCheck,
  RotateCcw,
  Heart,
  Sparkles,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronDown,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import type { SiteSettings } from "@/lib/catalog";
import { buildWhatsAppLink, generalInquiryMessage } from "@/lib/whatsapp";

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

// The icons a trust badge can use - the Studio lists the same names
// (schemaTypes/homepageSections.ts).
const BADGE_ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  award: Award,
  shield: ShieldCheck,
  returns: RotateCcw,
  heart: Heart,
  sparkles: Sparkles,
};

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

function ContactList({ settings }: { settings: SiteSettings }) {
  const social = [
    { href: settings.instagramUrl, label: "Instagram" },
    { href: settings.facebookUrl, label: "Facebook" },
    { href: settings.youtubeUrl, label: "YouTube" },
  ].filter((s) => s.href);
  return (
    <div className="space-y-2 text-xs text-band-soft">
      {settings.whatsappNumber && (
        <a
          href={buildWhatsAppLink(settings.whatsappNumber, settings.whatsappDefaultMessage || generalInquiryMessage(settings.storeName))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-colors hover:text-band-accent"
        >
          <MessageCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          WhatsApp us
        </a>
      )}
      <a href={settings.phoneLink} className="flex items-center gap-2 transition-colors hover:text-band-accent">
        <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        {settings.displayPhone}
      </a>
      <a
        href={`mailto:${settings.supportEmail}`}
        className="flex items-center gap-2 break-all transition-colors hover:text-band-accent"
      >
        <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        {settings.supportEmail}
      </a>
      <p className="flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        {settings.location}
      </p>
      <p className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
        {settings.supportHours}
      </p>
      {social.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-colors hover:text-band-accent"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {s.label}
        </a>
      ))}
    </div>
  );
}

function Logo({ src, size, alt }: { src: string; size: string; alt: string }) {
  return (
    <span className={`relative mb-3 block overflow-hidden rounded-full ring-1 ring-gold/70 ${size}`}>
      {src && <Image src={src} alt={alt} fill sizes="64px" className="object-cover" />}
    </span>
  );
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const SECTIONS = [
    { title: "Quick Links", body: <LinkList links={QUICK_LINKS} /> },
    { title: "Customer Info", body: <LinkList links={POLICY_LINKS} /> },
    { title: "Contact Info", body: <ContactList settings={settings} /> },
  ];
  return (
    // The bottom padding keeps the last line clear of the phone tab bar.
    <footer className="w-full border-t border-gold/40 bg-band pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-band-fg lg:pb-6">
      <div className="w-full px-3 py-5 sm:px-4 lg:px-5 lg:py-6">
        <div className="hidden items-start justify-between gap-10 lg:flex">
          <div className="max-w-[280px] flex-shrink-0">
            <Logo src={settings.logo} size="h-16 w-16" alt={settings.storeName} />
            <p className="text-xs leading-relaxed text-band-soft">{settings.footerAbout}</p>
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
            <Logo src={settings.logo} size="h-14 w-14" alt={settings.storeName} />
            <p className="max-w-[280px] text-xs leading-relaxed text-band-soft">{settings.footerAbout}</p>
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

        {settings.trustBadges.length > 0 && (
          <div className="mt-6 border-t border-band-line pt-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-2">
              {settings.trustBadges.map((badge) => {
                const Icon = BADGE_ICONS[badge.icon] ?? Sparkles;
                return (
                  <div key={badge.title} className="flex flex-col items-center text-center sm:px-1">
                    <Icon className="mb-1.5 h-5 w-5 text-gold" strokeWidth={1.5} />
                    <span className="text-[11px] font-medium">{badge.title}</span>
                    <span className="text-[10px] text-band-soft">{badge.subtitle}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-6 border-t border-band-line px-2 pt-5 text-center text-[11px] leading-relaxed text-band-soft sm:text-xs">
          © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
