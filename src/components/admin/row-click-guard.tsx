"use client";

/** Stops a click on an in-row control (link, button, toggle) from bubbling up
 * to a parent row's own click-to-edit handler. */
export function RowClickGuard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div onClick={(e) => e.stopPropagation()} className={className}>
      {children}
    </div>
  );
}
