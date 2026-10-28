import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyContent } from "@/components/policy-page";
import { getPolicyPage } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Review the privacy policy for Shravs Saree Collection. Understand how we collect, protect, and handle your personal data and payment security.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

/* The page's text is edited in the Studio: Pages → Policy & Legal Pages. */
export default async function PrivacyPolicyPage() {
  const page = await getPolicyPage("privacy-policy");
  if (!page) notFound();
  return <PolicyContent page={page} />;
}
