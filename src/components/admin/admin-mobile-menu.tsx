"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

/** The admin panel's menu button on phones and small tablets, where the
 * sidebar is hidden - the layout passes in the same links the sidebar shows.
 * Closes as soon as a link inside it is tapped: the layout stays mounted
 * across admin pages, so it would otherwise stay open over the next page. */
export function AdminMobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="rounded-full p-2 transition-colors hover:bg-band-fg/10"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div
          id="admin-mobile-menu"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
          className="absolute inset-x-0 top-full border-t border-band-fg/10 bg-band px-3 pb-4 pt-2 shadow-lg"
        >
          {children}
        </div>
      )}
    </>
  );
}
