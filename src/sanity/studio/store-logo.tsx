"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { client } from "@/sanity/client";

/* The store's logo from Storefront Settings, as the Studio's workspace icon.
   Fetched once and shared by every place the Studio shows it. */
let logoRequest: Promise<string | null> | null = null;

export function StoreLogo() {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    logoRequest ??= client.fetch<string | null>(`*[_id == "siteSettings"][0].logo.asset->url`);
    logoRequest.then(setLogo);
  }, []);

  if (!logo) return null;
  return (
    <Image
      src={logo}
      alt=""
      width={64}
      height={64}
      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
    />
  );
}
