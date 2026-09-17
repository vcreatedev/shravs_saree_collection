import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ASSETS_DIR = path.join(__dirname, "..", "public", "assets");

type ProductAssets = {
  slug: string;
  category: string;
  files: string[];
};

const PRODUCTS: ProductAssets[] = [
  {
    slug: "purple-embroidered-anarkali-gown",
    category: "anarkali-gowns",
    files: [
      "WhatsApp Image 2026-09-17 at 9.51.19 PM.jpeg",
      "WhatsApp Image 2026-09-17 at 9.51.20 PM.jpeg",
      "WhatsApp Image 2026-09-17 at 9.51.21 PM.jpeg",
    ],
  },
  {
    slug: "deep-violet-embroidered-anarkali-gown",
    category: "anarkali-gowns",
    files: [
      "WhatsApp Image 2026-09-17 at 9.51.21 PM (1).jpeg",
      "WhatsApp Image 2026-09-17 at 9.51.22 PM.jpeg",
      "WhatsApp Image 2026-09-17 at 9.51.22 PM (1).jpeg",
      "WhatsApp Image 2026-09-17 at 9.51.23 PM.jpeg",
    ],
  },
  {
    slug: "floral-print-georgette-saree",
    category: "printed-sarees",
    files: [
      "WhatsApp Image 2026-09-17 at 9.51.24 PM.jpeg",
      "WhatsApp Image 2026-09-17 at 9.51.24 PM (1).jpeg",
    ],
  },
  {
    slug: "maroon-silk-saree-with-belt",
    category: "silk-sarees",
    files: [
      "WhatsApp Image 2026-09-17 at 9.51.25 PM (1).jpeg",
      "WhatsApp Image 2026-09-17 at 9.51.26 PM (1).jpeg",
    ],
  },
  {
    slug: "wine-chevron-silk-saree",
    category: "silk-sarees",
    files: [
      "WhatsApp Image 2026-09-17 at 9.51.23 PM (2).jpeg",
      "WhatsApp Image 2026-09-17 at 9.51.26 PM (2).jpeg",
    ],
  },
];

async function main() {
  const result: Record<string, string[]> = {};

  for (const product of PRODUCTS) {
    result[product.slug] = [];
    for (let i = 0; i < product.files.length; i++) {
      const filePath = path.join(ASSETS_DIR, product.files[i]);
      const publicId = `shravs-saree-collections/${product.category}/${product.slug}-${i + 1}`;
      const uploaded = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
      });
      result[product.slug].push(uploaded.secure_url);
      console.log(`Uploaded ${product.files[i]} -> ${uploaded.secure_url}`);
    }
  }

  console.log("\n--- JSON summary ---");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
