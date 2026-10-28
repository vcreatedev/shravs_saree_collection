import type { StructureResolver } from "sanity/structure";
import { SINGLETON_TYPES } from "../schemaTypes";

/* Shravs Saree Collection - Studio menu, following VSN Vastraa's: each group
   maps to what it changes on the site. Orders have their own tool in the top
   bar. */

const singleton = (S: Parameters<StructureResolver>[0], title: string, schemaType: string) =>
  S.listItem()
    .id(schemaType)
    .title(title)
    .schemaType(schemaType)
    .child(S.document().title(title).schemaType(schemaType).documentId(schemaType));

const productList = (S: Parameters<StructureResolver>[0], id: string, title: string, filter: string) =>
  S.listItem()
    .id(id)
    .title(title)
    .schemaType("product")
    .child(
      S.documentList()
        .title(title)
        .schemaType("product")
        .filter(filter)
        .defaultOrdering([{ field: "_updatedAt", direction: "desc" }])
    );

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Shravs Saree Collection")
    .items([
      S.listItem()
        .id("homepage")
        .title("Homepage")
        .child(
          S.list()
            .title("Homepage (top to bottom)")
            .items([
              singleton(S, "Announcement Strip", "marqueeSection"),
              S.listItem()
                .id("home-hero")
                .title("Hero Slides")
                .schemaType("heroBanner")
                .child(
                  S.documentList()
                    .title("Hero Slides")
                    .schemaType("heroBanner")
                    .filter('_type == "heroBanner"')
                    .defaultOrdering([{ field: "order", direction: "asc" }])
                ),
              productList(S, "home-new", "New Collections", '_type == "product" && isNewArrival == true'),
              productList(S, "home-best", "Best Sellers", '_type == "product" && isBestSeller == true'),
              S.listItem()
                .id("home-categories")
                .title("Shop by Category")
                .schemaType("category")
                .child(
                  S.documentList()
                    .title("Collections")
                    .schemaType("category")
                    .filter('_type == "category"')
                    .defaultOrdering([{ field: "orderRank", direction: "asc" }])
                ),
              singleton(S, "Trust Badges (footer)", "trustBadgesSection"),
            ])
        ),

      S.divider(),

      S.listItem()
        .id("catalogue")
        .title("Catalogue")
        .child(
          S.list()
            .title("Catalogue")
            .items([
              productList(S, "cat-all", "All Products", '_type == "product"'),
              S.listItem()
                .id("cat-by-collection")
                .title("By Collection")
                .child(
                  S.documentTypeList("category")
                    .title("Collections")
                    .defaultOrdering([{ field: "orderRank", direction: "asc" }])
                    .child((categoryId) =>
                      S.documentList()
                        .title("Products")
                        .schemaType("product")
                        .filter('_type == "product" && category._ref == $categoryId')
                        .params({ categoryId })
                    )
                ),
              S.divider(),
              productList(S, "cat-new", "✦ New Arrivals", '_type == "product" && isNewArrival == true'),
              productList(S, "cat-best", "★ Best Sellers", '_type == "product" && isBestSeller == true'),
              productList(
                S,
                "cat-low-stock",
                "Low or Out of Stock",
                '_type == "product" && (inStock == false || (count(sizes) > 0 && math::sum(sizes[].stockQuantity) <= 2) || (count(sizes) == 0 && coalesce(stockQuantity, 0) <= 2))'
              ),
              S.divider(),
              S.documentTypeListItem("category").title("Collections / Categories"),
            ])
        ),

      S.divider(),

      S.listItem()
        .id("pages")
        .title("Pages")
        .child(
          S.list()
            .title("Pages")
            .items([
              singleton(S, "Contact Us Page", "contactPage"),
              S.documentTypeListItem("policyPage").title("Policy & Legal Pages"),
            ])
        ),

      S.divider(),

      singleton(S, "Storefront Settings", "siteSettings"),

      /* anything added to the schema later that isn't placed above */
      ...S.documentTypeListItems().filter(
        (item) =>
          !["product", "category", "heroBanner", "policyPage", ...SINGLETON_TYPES].includes(item.getId() || "")
      ),
    ]);
