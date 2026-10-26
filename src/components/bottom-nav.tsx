"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, Sparkles, ShoppingCart, Package, type LucideIcon } from "lucide-react";
import { useCartStore, cartCount } from "@/store/cart-store";
import { useMounted } from "@/lib/use-mounted";

type Tab = { href: string; label: string; icon: LucideIcon; exact?: boolean };

// The cart button sits between these two groups.
const TABS_BEFORE_CART: Tab[] = [
  { href: "/", label: "Home", icon: House, exact: true },
  { href: "/shop", label: "Collections", icon: LayoutGrid, exact: true },
  { href: "/shop?tag=new", label: "New", icon: Sparkles },
];
const TABS_AFTER_CART: Tab[] = [{ href: "/orders/my", label: "Orders", icon: Package }];

const ITEM_CLASS =
  "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-opacity active:opacity-80 tap-highlight-none";

function TabContent({ icon: Icon, label, active }: { icon: LucideIcon; label: string; active: boolean }) {
  return (
    <>
      {active && <span className="absolute left-1/2 top-0 h-[2px] w-8 -translate-x-1/2 rounded-full bg-band-bar" />}
      <span className="relative flex h-7 items-center justify-center">
        <Icon className={`h-6 w-6 shrink-0 ${active ? "text-band-fg" : "text-band-soft/70"}`} strokeWidth={1.5} />
      </span>
      <span className={`max-w-full truncate text-[10px] leading-none sm:text-[11px] ${active ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
    </>
  );
}

function TabLink({ tab, pathname }: { tab: Tab; pathname: string }) {
  // Matched on the path alone (the query string isn't part of it), so the
  // "New" tab never lights up over "Collections".
  const path = tab.href.split("?")[0];
  const active = !tab.href.includes("?") && (tab.exact ? pathname === path : pathname.startsWith(path));
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`${ITEM_CLASS} ${active ? "text-band-fg" : "text-band-soft/70"}`}
    >
      <TabContent icon={tab.icon} label={tab.label} active={active} />
    </Link>
  );
}

/** The phone and tablet tab bar pinned to the bottom of the storefront. */
export function BottomNav() {
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.open);
  const mounted = useMounted();
  const count = mounted ? cartCount(items) : 0;

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/40 bg-band pb-[env(safe-area-inset-bottom)] text-band-fg shadow-[0_-4px_20px_rgb(0_0_0/0.3)] lg:hidden"
    >
      <div className="flex h-[4.25rem] items-stretch justify-around px-0.5">
        {TABS_BEFORE_CART.map((tab) => (
          <TabLink key={tab.href} tab={tab} pathname={pathname} />
        ))}
        <button type="button" onClick={openCart} className={`${ITEM_CLASS} text-band-soft/70`}>
          <TabContent icon={ShoppingCart} label="Cart" active={false} />
          {count > 0 && (
            <span className="absolute left-1/2 top-1.5 ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-semibold text-band">
              {count}
            </span>
          )}
        </button>
        {TABS_AFTER_CART.map((tab) => (
          <TabLink key={tab.href} tab={tab} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}
