import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyContent } from "@/components/policy-page";
import { getPolicyPage } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Learn about Shravs Saree Collection shipping policies, pan-India delivery timelines, courier partners, and tracking information.",
  alternates: {
    canonical: "/shipping-policy",
  },
};

/* The page's text is edited in the Studio: Pages → Policy & Legal Pages. */
export default async function ShippingPolicyPage() {
  const page = await getPolicyPage("shipping-policy");
  if (!page) notFound();
  return <PolicyContent page={page} />;
}
