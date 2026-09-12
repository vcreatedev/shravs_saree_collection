import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Tags } from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Tags },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-shrink-0 flex-col justify-between bg-ink px-4 py-6 text-cream md:flex">
        <div>
          <Link href="/admin" className="block px-2 font-display text-xl italic">
            LUMORA
          </Link>
          <p className="px-2 text-xs text-cream/50">Admin panel</p>

          <nav className="mt-8 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-2 border-t border-cream/10 pt-4">
          <Link href="/" className="block px-3 text-xs text-cream/50 hover:text-cream">
            ← Back to storefront
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-cream px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
