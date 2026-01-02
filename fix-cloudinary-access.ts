// Script to make existing Cloudinary files public
import { config as dotenvConfig } from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Load environment variables
dotenvConfig();

// Parse CLOUDINARY_URL
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
  console.error("❌ CLOUDINARY_URL is not defined in environment variables");
  process.exit(1);
}

const config = parseCloudinaryUrl(cloudinaryUrl);

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
  secure: true,
});

async function makeFilesPublic() {
  try {
    console.log("🔍 Searching for files in mathify/materials folder...\n");

    // List all files in mathify/materials
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "mathify/materials",
      max_results: 500,
    });

    console.log(`Found ${result.resources.length} files\n`);

    for (const resource of result.resources) {
      console.log(
        `Processing: ${resource.public_id} (${
          resource.access_mode || "authenticated"
        })`
      );

      // Update access_mode to public
      try {
        await cloudinary.api.update(resource.public_id, {
          access_mode: "public",
        });
        console.log(`✅ Made public: ${resource.public_id}\n`);
      } catch (error) {
        console.error(`❌ Failed to update ${resource.public_id}:`, error);
      }
    }

    console.log("\n✅ All files updated!");
    console.log("\nNow all files should be accessible without authentication.");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

makeFilesPublic();
