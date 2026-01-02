// Change Cloudinary files from authenticated to upload type
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

async function changeToUploadType() {
  try {
    console.log("🔍 Listing authenticated files...\n");

    // List authenticated files
    const result = await cloudinary.api.resources({
      type: "authenticated",
      prefix: "mathify/materials",
      max_results: 500,
    });

    console.log(`Found ${result.resources.length} authenticated files\n`);

    if (result.resources.length === 0) {
      console.log(
        "✅ No authenticated files found! All files might already be public."
      );
      console.log("\nTrying to list upload type files instead...\n");

      const uploadResult = await cloudinary.api.resources({
        type: "upload",
        prefix: "mathify/materials",
        max_results: 500,
      });

      console.log(`Found ${uploadResult.resources.length} upload type files:`);
      for (const resource of uploadResult.resources) {
        console.log(`- ${resource.public_id}`);
        console.log(`  URL: ${resource.secure_url}\n`);
      }
      return;
    }

    for (const resource of result.resources) {
      console.log(`Processing: ${resource.public_id}`);
      console.log(`Old URL: ${resource.secure_url}`);

      try {
        // Use explicit method to change from authenticated to upload
        const result = await cloudinary.uploader.explicit(resource.public_id, {
          type: "upload",
          resource_type: "image",
        });

        console.log(`✅ Changed to upload type`);
        console.log(`New URL: ${result.secure_url}\n`);
      } catch (error: any) {
        console.error(`❌ Failed:`, error.message);
        console.log();
      }
    }

    console.log("\n✅ Done! Files should now be publicly accessible.");
  } catch (error: any) {
    console.error("❌ Error:", error.message || error);
    process.exit(1);
  }
}

changeToUploadType();
