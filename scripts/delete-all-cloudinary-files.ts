// Delete ALL files from Cloudinary mathify/materials folder
import { config as dotenvConfig } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenvConfig();

function parseCloudinaryUrl(url: string) {
  const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (!match) {
    throw new Error("Invalid CLOUDINARY_URL format");
  }
  return {
    api_key: match[1],
    api_secret: match[2],
    cloud_name: match[3],
  };
}

const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (!cloudinaryUrl) {
  console.error("❌ CLOUDINARY_URL is not defined");
  process.exit(1);
}

const config = parseCloudinaryUrl(cloudinaryUrl);

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
  secure: true,
});

async function deleteAllFiles() {
  try {
    console.log("🔍 Listing all files in mathify/materials...\n");

    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "mathify/materials",
      max_results: 500,
    });

    console.log(`Found ${result.resources.length} files\n`);

    if (result.resources.length === 0) {
      console.log("✅ No files to delete!");
      return;
    }

    console.log("⚠️  THIS WILL DELETE ALL FILES! Press Ctrl+C to cancel...\n");
    console.log("Waiting 5 seconds...\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    for (const resource of result.resources) {
      console.log(`🗑️  Deleting: ${resource.public_id}`);

      try {
        await cloudinary.uploader.destroy(resource.public_id, {
          resource_type: "image",
          invalidate: true,
        });
        console.log(`   ✅ Deleted\n`);
      } catch (error: any) {
        console.error(`   ❌ Failed:`, error.message);
      }
    }

    console.log("\n✅ All files deleted from Cloudinary!");
    console.log(
      "\n📝 Now you need to re-upload materials through the app interface."
    );
    console.log("   The new uploads will work correctly with the fixed code.");
  } catch (error: any) {
    console.error("❌ Error:", error.message || error);
    process.exit(1);
  }
}

deleteAllFiles();
