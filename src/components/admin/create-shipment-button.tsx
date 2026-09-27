"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Truck } from "lucide-react";
import toast from "react-hot-toast";

export function CreateShipmentButton({
  orderId,
  awbCode,
  courierName,
  trackingUrl,
}: {
  orderId: string;
  awbCode: string | null;
  courierName: string | null;
  trackingUrl: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (awbCode) {
    return (
      <a
        href={trackingUrl ?? undefined}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-full border hairline px-4 py-2 text-sm font-medium hover:border-ink"
      >
        <Truck className="h-4 w-4" />
        {courierName ? `${courierName} · ${awbCode}` : awbCode}
      </a>
    );
  }

  async function handleClick() {
    if (pending) return;
    setPending(true);
    const res = await fetch(`/api/admin/orders/${orderId}/shiprocket`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Could not create the shipment.");
      setPending(false);
      return;
    }
    toast.success("Shipment created");
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-2 rounded-full border hairline px-4 py-2 text-sm font-medium hover:border-ink disabled:opacity-60"
    >
      <Truck className="h-4 w-4" />
      {pending ? "Creating shipment…" : "Create shipment"}
    </button>
  );
}
