import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyContent } from "@/components/policy-page";
import { getPolicyPage } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Read our clear 7-day return and refund policy at Shravs Saree Collection. Hassle-free cancellations, simple returns, and transparent timelines.",
  alternates: {
    canonical: "/refund-policy",
  },
};

/* The page's text is edited in the Studio: Pages → Policy & Legal Pages. */
export default async function RefundPolicyPage() {
  const page = await getPolicyPage("refund-policy");
  if (!page) notFound();
  return <PolicyContent page={page} />;
}
