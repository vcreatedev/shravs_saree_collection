"use client";

import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink, generalInquiryMessage } from "@/lib/whatsapp";

export function WhatsAppButton() {
  const href = buildWhatsAppLink(generalInquiryMessage());

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-forest text-paper shadow-[0_8px_24px_rgba(31,90,69,0.35)] transition-all hover:pr-5 active:scale-95 tap-highlight-none"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full">
        <MessageCircle className="h-6 w-6" strokeWidth={2} />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 group-hover:max-w-[140px]">
        Chat with us
      </span>
    </a>
  );
}
