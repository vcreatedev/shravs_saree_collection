"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { buildWhatsAppLink, orderShareMessage } from "@/lib/whatsapp";
import { useSiteSettings } from "@/components/site-settings";
import type { Order } from "@/types";

export function PostPurchaseActions({ order }: { order: Order }) {
  const router = useRouter();
  const settings = useSiteSettings();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    const link = document.createElement("a");
    link.href = `/api/orders/${order.id}/invoice`;
    link.download = `invoice-${order.orderNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.open(buildWhatsAppLink(settings.whatsappNumber, orderShareMessage(order, settings.storeName)), "_blank", "noopener,noreferrer");

    router.replace(`/orders/${order.id}`);
  }, [order, router, settings]);

  return null;
}
