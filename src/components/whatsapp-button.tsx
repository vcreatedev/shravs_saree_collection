"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink, generalInquiryMessage } from "@/lib/whatsapp";

/** Phones and tablets only, sitting just above the tab bar - from lg up the
 * WhatsApp link lives in the header's announcement strip instead. */
export function WhatsAppButton() {
  const href = buildWhatsAppLink(generalInquiryMessage());

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-signal text-band-fg shadow-lg ring-2 ring-gold transition-transform duration-300 hover:scale-105 active:scale-95 tap-highlight-none lg:hidden"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
