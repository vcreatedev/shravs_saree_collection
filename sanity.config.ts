"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { DashboardIcon } from "@sanity/icons/Dashboard";
import { PackageIcon } from "@sanity/icons/Package";
import { schemaTypes, SINGLETON_TYPES } from "@/sanity/schemaTypes";
import { structure } from "@/sanity/studio/structure";
import { OrdersTool } from "@/sanity/studio/orders-tool";
import { OverviewTool } from "@/sanity/studio/overview-tool";
import { ShopNavbar } from "@/sanity/studio/navbar";
import { StoreLogo } from "@/sanity/studio/store-logo";
import { studioTheme } from "@/sanity/studio/theme";
import { projectId } from "@/sanity/env";

/* The Studio at /admin, following VSN Vastraa's. One workspace per dataset:
   "Live shop" (production, what customers see) and "Test" (development,
   what local development shows). The live site's Studio offers both; a
   local Studio only Test, so local work can never change the live shop. */
const SITE_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

const workspace = (options: { name: string; title: string; subtitle: string; dataset: string }) =>
  defineConfig({
    ...options,
    basePath: `/admin/${options.name}`,
    projectId,
    // In the shop's colours and fonts, with its logo and wine top bar.
    theme: studioTheme,
    icon: StoreLogo,
    studio: { components: { navbar: ShopNavbar } },
    // The Orders tool sends the editor's own login to the site's delivery
    // routes, which ask Sanity who it is - a token login makes that possible.
    auth: { loginMethod: "token" },
    tools: (prev) => [
      { name: "overview", title: "Overview", icon: DashboardIcon, component: OverviewTool },
      { name: "orders", title: "Orders", icon: PackageIcon, component: OrdersTool },
      ...prev,
    ],
    plugins: [structureTool({ structure }), visionTool()],
    schema: {
      types: schemaTypes,
      // Single documents can't be added again or deleted from "Create new".
      templates: (prev) => prev.filter((template) => !SINGLETON_TYPES.includes(template.schemaType)),
    },
    document: {
      actions: (prev, { schemaType }) =>
        SINGLETON_TYPES.includes(schemaType)
          ? prev.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
          : prev,
    },
  });

const live = workspace({ name: "live", title: "Live shop", subtitle: "Customers see this", dataset: "production" });
const test = workspace({ name: "test", title: "Test", subtitle: "Only local development shows this", dataset: "development" });

export default SITE_DATASET === "production" ? [live, test] : [test];
