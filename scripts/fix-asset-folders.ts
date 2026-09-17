import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  const { resources } = await cloudinary.api.resources({
    type: "upload",
    prefix: "shravs-saree-collections",
    max_results: 100,
  });

  for (const resource of resources) {
    const publicId: string = resource.public_id;
    const lastSlash = publicId.lastIndexOf("/");
    const assetFolder = publicId.slice(0, lastSlash);

    await cloudinary.api.update(publicId, { asset_folder: assetFolder });
    console.log(`Set folder for ${publicId} -> ${assetFolder}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
