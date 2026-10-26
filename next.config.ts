import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // Every image in the app is a Cloudinary URL - let Cloudinary's own CDN
    // and transformation pipeline serve them directly instead of also
    // routing through Next's built-in image optimizer (an extra hop/function
    // invocation on top of what Cloudinary already does).
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.ts",
    // Each distinct width is a separate Cloudinary transformation that has
    // to be generated cold on its first-ever request. The defaults (8 device
    // sizes up to 3840px, 7 thumbnail sizes) are overkill for a product
    // gallery that only ever renders at ~50vw/100vw or small fixed
    // thumbnails - trimmed to the sizes this app actually uses so real
    // traffic concentrates on fewer variants and they stay warm.
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
