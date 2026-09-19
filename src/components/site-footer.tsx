import Link from "next/link";

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || "Shravs Saree Collection";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export function SiteFooter() {
  return (
    <footer className="border-t hairline bg-band text-band-fg/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="font-display text-2xl italic text-band-fg">{STORE_NAME}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed">
            Small-batch, thoughtfully sourced goods. Every order is packed by hand and shipped
            with care.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-band-fg">Shop</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/shop" className="hover:text-signal transition-colors">
                All products
              </Link>
            </li>
            <li>
              <Link href="/shop?tag=new" className="hover:text-signal transition-colors">
                New arrivals
              </Link>
            </li>
            <li>
              <Link href="/shop?sort=rating" className="hover:text-signal transition-colors">
                Best rated
              </Link>
            </li>
            <li>
              <Link href="/orders/my" className="hover:text-signal transition-colors">
                My orders
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-band-fg">Policies</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/shipping-policy" className="hover:text-signal transition-colors">
                Shipping policy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-signal transition-colors">
                Refund &amp; cancellation
              </Link>
            </li>
            <li>
              <Link href="/terms-and-conditions" className="hover:text-signal transition-colors">
                Terms &amp; conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-signal transition-colors">
                Privacy policy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-band-fg">Contact</p>
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
            <li>
              <Link href="/contact-us" className="hover:text-signal transition-colors">
                Contact us
              </Link>
            </li>
            <li>Mon–Sat, 10am–7pm IST</li>
          </ul>
        </div>
      </div>
      <div className="border-t hairline border-band-fg/10 px-5 py-5 text-center text-xs text-band-fg/50 sm:px-8">
        © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
