export function PolicyPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-4xl font-bold">{title}</h1>
      <p className="mt-2 text-xs uppercase tracking-wide text-ink-soft">Last updated: {updated}</p>
      <div className="policy-content mt-8 space-y-6 leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

export function PolicySection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-ink">{heading}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
