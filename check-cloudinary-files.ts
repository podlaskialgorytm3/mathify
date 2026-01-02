// Check URL of Cloudinary files
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

async function checkFiles() {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "mathify/materials",
      max_results: 10,
    });

    console.log("\n📁 Files in Cloudinary:\n");
    for (const resource of result.resources) {
      console.log(`Public ID: ${resource.public_id}`);
      console.log(`URL: ${resource.secure_url}`);
      console.log(`Access Mode: ${resource.access_mode || "authenticated"}`);
      console.log(`Resource Type: ${resource.resource_type}`);
      console.log(`Format: ${resource.format}`);
      console.log("---");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkFiles();
