"use client";

import { Download, MessageCircle } from "lucide-react";
import { buildWhatsAppLink, orderShareMessage, orderStatusInquiryMessage } from "@/lib/whatsapp";
import { useSiteSettings } from "@/components/site-settings";
import type { Order } from "@/types";

export function OrderActions({ order }: { order: Order }) {
  const settings = useSiteSettings();
  const shareHref = buildWhatsAppLink(settings.whatsappNumber, orderShareMessage(order, settings.storeName));
  const inquiryHref = buildWhatsAppLink(settings.whatsappNumber, orderStatusInquiryMessage(order.orderNumber));

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href={`/api/orders/${order.id}/invoice`}
        download
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-signal"
      >
        <Download className="h-4 w-4" /> Download invoice
      </a>
      <a
        href={order.status === "CONFIRMED" ? shareHref : inquiryHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-forest py-3.5 text-sm font-semibold uppercase tracking-wide text-forest transition-colors hover:bg-forest hover:text-paper"
      >
        <MessageCircle className="h-4 w-4" /> Share on WhatsApp
      </a>
    </div>
  );
}
