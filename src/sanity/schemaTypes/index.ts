import { categoryType } from "./categoryType";
import { heroBannerType } from "./heroBannerType";
import { marqueeSectionType, trustBadgesSectionType } from "./homepageSections";
import { contactPageType, policyPageType } from "./policyPageType";
import { productType } from "./productType";
import { siteSettingsType } from "./siteSettingsType";

/* Orders aren't listed here: they're private documents the site saves, shown
   and managed in the Studio's own Orders tool rather than edited as forms. */
export const schemaTypes = [
  productType,
  categoryType,
  heroBannerType,
  siteSettingsType,
  contactPageType,
  policyPageType,
  marqueeSectionType,
  trustBadgesSectionType,
];

/** Single documents, each kept at a fixed id equal to its type name. */
export const SINGLETON_TYPES = ["siteSettings", "contactPage", "marqueeSection", "trustBadgesSection"];
