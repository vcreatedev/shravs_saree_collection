import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyContent } from "@/components/policy-page";
import { getPolicyPage } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Review the terms and conditions for ordering handpicked sarees and ethnic apparel at Shravs Saree Collection.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
};

/* The page's text is edited in the Studio: Pages → Policy & Legal Pages. */
export default async function TermsPage() {
  const page = await getPolicyPage("terms-and-conditions");
  if (!page) notFound();
  return <PolicyContent page={page} />;
}
