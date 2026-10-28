import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
    // Product photos are Sanity image URLs - Sanity's image CDN resizes and
    // converts them itself (src/lib/image-loader.ts) instead of them also
    // going through Next's built-in image optimizer.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Each distinct width is a separate transformation the CDN generates cold
    // on its first-ever request. The defaults (8 device sizes up to 3840px, 7
    // thumbnail sizes) are overkill for a gallery that only renders at
    // ~50vw/100vw or small fixed thumbnails - trimmed to the sizes this app
    // uses, so real traffic concentrates on fewer variants that stay warm.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 96, 128],
  },
  async redirects() {
    return [
      {
        source: "/sitemaps.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
