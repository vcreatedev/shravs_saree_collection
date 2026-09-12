import Link from "next/link";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export function SiteFooter() {
  return (
    <footer className="border-t hairline bg-ink text-cream/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl italic text-cream">{STORE_NAME}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed">
            Small-batch, thoughtfully sourced goods. Every order is packed by hand and shipped
            with care.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream">Shop</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/shop" className="hover:text-signal transition-colors">
                All products
              </Link>
            </li>
            <li>
              <Link href="/orders/track" className="hover:text-signal transition-colors">
                Track an order
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-signal transition-colors">
                Admin panel
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cream">Contact</p>
          <ul className="mt-4 space-y-2 text-sm">
            {WHATSAPP_NUMBER && (
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-signal transition-colors"
                >
                  WhatsApp us
                </a>
              </li>
            )}
            <li>Mon–Sat, 10am–7pm IST</li>
          </ul>
        </div>
      </div>
      <div className="border-t hairline border-cream/10 px-5 py-5 text-center text-xs text-cream/50 sm:px-8">
        © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
