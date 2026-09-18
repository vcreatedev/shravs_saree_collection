"use client";

import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useCartStore, cartSubtotal } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { computeShipping } from "@/lib/orders";
import { useMounted } from "@/lib/use-mounted";
import type { CheckoutAddress } from "@/types";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";

const emptyAddress: CheckoutAddress = {
  customerName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const router = useRouter();
  const mounted = useMounted();
  const [address, setAddress] = useState<CheckoutAddress>(emptyAddress);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const shipping = computeShipping(subtotal);
  const total = subtotal + shipping;

  function updateField<K extends keyof CheckoutAddress>(key: K, value: CheckoutAddress[K]) {
    setAddress((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0 || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, address, paymentMethod: "RAZORPAY" }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }

      if (!window.Razorpay) {
        toast.error("Payment gateway is still loading. Please try again in a moment.");
        setSubmitting(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: STORE_NAME,
        description: "Order payment",
        order_id: data.razorpayOrderId,
        prefill: {
          name: data.customerName,
          email: data.email,
          contact: data.phone,
        },
        theme: { color: "#ff4b1f" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderId, ...response }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            clear();
            toast.success("Payment successful!");
            router.push(`/orders/${verifyData.orderId}?new=1`);
          } else {
            toast.error(verifyData.error || "Payment verification failed.");
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast("Payment cancelled.", { icon: "⚠️" });
            setSubmitting(false);
          },
        },
      });
      rzp.open();
    } catch {
      toast.error("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-display text-2xl italic">Your bag is empty</h1>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream hover:bg-signal"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <h1 className="font-display text-3xl italic">Checkout</h1>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
              Shipping details
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Full name"
                value={address.customerName}
                onChange={(e) => updateField("customerName", e.target.value)}
                className="col-span-2 w-full rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={address.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
              />
              <input
                required
                type="tel"
                placeholder="Phone number"
                value={address.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
              />
              <input
                required
                placeholder="Address"
                value={address.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="col-span-2 w-full rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
              />
              <input
                required
                placeholder="City"
                value={address.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="w-full rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
              />
              <input
                required
                placeholder="State"
                value={address.state}
                onChange={(e) => updateField("state", e.target.value)}
                className="w-full rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
              />
              <input
                required
                placeholder="Pincode"
                value={address.pincode}
                onChange={(e) => updateField("pincode", e.target.value)}
                className="w-full rounded-lg border hairline bg-paper px-4 py-3 text-sm focus:border-signal focus:outline-none"
              />
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
              Payment method
            </h2>
            <div className="mt-4 flex items-center gap-3 rounded-lg border-2 border-ink p-4">
              <div>
                <p className="text-sm font-medium">Pay online (Razorpay)</p>
                <p className="text-xs text-ink-soft">Cards, UPI, netbanking & wallets</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-signal py-4 text-sm font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-signal-dark disabled:opacity-60"
          >
            {submitting ? "Processing…" : `Pay ${formatPrice(total)}`}
          </button>
        </form>

        <div className="h-max rounded-2xl border hairline bg-paper p-6">
          <h2 className="font-display text-lg italic">Order summary</h2>
          <ul className="mt-4 space-y-4">
            {items.map((item) => (
              <li key={`${item.productId}-${item.color}-${item.size}`} className="flex min-w-0 gap-3">
                <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden rounded-md bg-cream">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="break-words font-medium leading-tight">{item.name}</p>
                    <p className="text-xs text-ink-soft">Qty {item.quantity}</p>
                  </div>
                  <p className="whitespace-nowrap font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 border-t hairline pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between border-t hairline pt-2 font-display text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
