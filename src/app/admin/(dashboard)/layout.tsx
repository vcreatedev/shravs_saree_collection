import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, Package, ShoppingBag, Tags, Image as ImageIcon } from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import { AdminMobileMenu } from "@/components/admin/admin-mobile-menu";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/hero", label: "Homepage", icon: ImageIcon },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // Shown twice: in the sidebar on desktop, in the menu on phones.
  const navLinks = NAV.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-band-fg/80 transition-colors hover:bg-band-fg/10 hover:text-band-fg"
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  ));

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Phones and small tablets: the sidebar below is hidden there, so the
          same links sit behind a menu button in a top bar instead. */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-band px-5 py-3 text-band-fg md:hidden">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <span className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-gold/40">
            <Image src="/logo.jpg" alt="Shravs Saree Collection" fill sizes="36px" className="object-cover" />
          </span>
          <span className="font-display text-lg italic">Admin</span>
        </Link>
        <AdminMobileMenu>
          <nav className="space-y-1">{navLinks}</nav>
          <div className="mt-3 space-y-1 border-t border-band-fg/10 pt-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-band-fg/70 transition-colors hover:bg-band-fg/10 hover:text-band-fg"
            >
              <ArrowUpRight className="h-4 w-4" />
              View live site
            </Link>
            <LogoutButton />
          </div>
        </AdminMobileMenu>
      </header>

      <aside className="hidden w-60 flex-shrink-0 flex-col justify-between bg-band px-4 py-6 text-band-fg md:flex">
        <div>
          <Link href="/admin" className="block px-2 font-display text-lg leading-snug italic">
            Shravs Saree Collection
          </Link>
          <p className="px-2 text-xs text-band-fg/50">Admin panel</p>

          <nav className="mt-8 space-y-1">{navLinks}</nav>
        </div>

        <div className="space-y-2 border-t border-band-fg/10 pt-4">
          <Link href="/" className="block px-3 text-xs text-band-fg/50 hover:text-band-fg">
            ← Back to storefront
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-cream px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
