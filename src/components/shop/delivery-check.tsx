"use client";

import { useState } from "react";
import { Truck } from "lucide-react";

type Result = { status: "serviceable"; days: number | null } | { status: "unserviceable" | "unknown" } | { status: "error"; message: string };

function deliveryDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days + 1); // a day to pack
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** "Check delivery": whether any courier partner delivers to a pincode, and
 * the earliest it could arrive. */
export function DeliveryCheck() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setResult({ status: "error", message: "Enter a 6-digit pincode." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/delivery/check?pincode=${pincode}`);
      const data = await res.json();
      setResult(res.ok ? data : { status: "error", message: data.error ?? "Couldn't check right now." });
    } catch {
      setResult({ status: "error", message: "Couldn't check right now." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="h-4 w-4 text-gold" strokeWidth={1.75} /> Check delivery
      </p>
      <form onSubmit={check} className="mt-3 flex gap-2">
        <input
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, ""));
            setResult(null);
          }}
          placeholder="Enter pincode"
          aria-label="Pincode"
          className="h-10 min-w-0 flex-1 rounded-md border border-line bg-cream px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-10 rounded-md border border-signal px-4 text-sm font-medium text-signal transition-colors hover:bg-signal hover:text-paper disabled:opacity-50"
        >
          {busy ? "Checking…" : "Check"}
        </button>
      </form>
      {result && (
        <p className={`mt-2 text-xs ${result.status === "serviceable" ? "text-forest" : result.status === "unknown" ? "text-ink-soft" : "text-signal"}`}>
          {result.status === "serviceable" &&
            (result.days ? `Delivers to ${pincode} by ${deliveryDate(result.days)}.` : `We deliver to ${pincode}.`)}
          {result.status === "unserviceable" && `Sorry, we can't deliver to ${pincode} yet - message us on WhatsApp.`}
          {result.status === "unknown" && "We ship across India; delivery usually takes 3-8 business days."}
          {result.status === "error" && result.message}
        </p>
      )}
    </div>
  );
}
