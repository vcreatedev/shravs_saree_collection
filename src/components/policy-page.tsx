import Link from "next/link";
import { Fragment } from "react";
import type { PageSection, PolicyPageContent } from "@/lib/catalog";

export function PolicyPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-4xl font-bold">{title}</h1>
      {updated && <p className="mt-2 text-xs uppercase tracking-wide text-ink-soft">Last updated: {updated}</p>}
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

const LINK_CLASS = "underline hover:text-signal";

// [words](/address or https://…), an email address, or a phone number.
const INLINE = /\[([^\]]+)\]\(((?:\/|https?:\/\/)[^)\s]*)\)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(\+91[\d ]{10,13}\d)/g;

/** One line of Studio text, with its links made clickable. */
function InlineText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const [whole, label, href, email, phone] = match;
    parts.push(text.slice(last, match.index));
    if (href) {
      parts.push(
        href.startsWith("/") ? (
          <Link key={match.index} href={href} className={LINK_CLASS}>
            {label}
          </Link>
        ) : (
          <a key={match.index} href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            {label}
          </a>
        )
      );
    } else if (email) {
      parts.push(
        <a key={match.index} href={`mailto:${email}`} className={LINK_CLASS}>
          {email}
        </a>
      );
    } else if (phone) {
      parts.push(
        <a key={match.index} href={`tel:${phone.replace(/\s/g, "")}`} className={LINK_CLASS}>
          {phone}
        </a>
      );
    }
    last = match.index + whole.length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

/** Studio text as paragraphs and bulleted lists: a blank line starts a new
 * paragraph, lines starting with "- " are list items. */
export function SectionText({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((line) => line.trimStart().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((line, j) => (
                <li key={j}>
                  <InlineText text={line.trimStart().slice(2)} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                <InlineText text={line} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

export function PageSections({ sections }: { sections: PageSection[] }) {
  return (
    <>
      {sections.map((section, i) => (
        <PolicySection key={i} heading={section.title}>
          <SectionText content={section.content} />
        </PolicySection>
      ))}
    </>
  );
}

/** A whole policy page from the Studio. */
export function PolicyContent({ page }: { page: PolicyPageContent }) {
  return (
    <PolicyPage title={page.title} updated={page.updatedDate}>
      {page.intro && <SectionText content={page.intro} />}
      <PageSections sections={page.sections} />
    </PolicyPage>
  );
}
