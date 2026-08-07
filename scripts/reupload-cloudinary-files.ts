// Delete and re-upload all files as public
import { config as dotenvConfig } from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "./src/lib/prisma";

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

async function reuploadFiles() {
  try {
    console.log("🔍 Listing all files...\n");

    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "mathify/materials",
      max_results: 500,
    });

    console.log(`Found ${result.resources.length} files\n`);

    for (const resource of result.resources) {
      console.log(`\n📄 Processing: ${resource.public_id}`);
      console.log(`   Current URL: ${resource.secure_url}`);
      console.log(`   Access Mode: ${resource.access_mode || "authenticated"}`);

      try {
        // Delete old file
        console.log("   🗑️  Deleting old version...");
        await cloudinary.uploader.destroy(resource.public_id, {
          resource_type: "image",
          invalidate: true,
        });

        // Download file
        console.log("   ⬇️  Downloading file...");
        const response = await fetch(resource.secure_url);
        if (!response.ok) {
          // Try with signed URL
          const signedUrl = cloudinary.url(resource.public_id, {
            sign_url: true,
            resource_type: "image",
            type: "upload",
          });
          const signedResponse = await fetch(signedUrl);
          if (!signedResponse.ok) {
            throw new Error(`Failed to download: ${response.status}`);
          }
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        // Re-upload as public
        console.log("   ⬆️  Re-uploading as public...");
        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                public_id: resource.public_id,
                resource_type: "image",
                type: "upload", // This makes it public
                overwrite: true,
                invalidate: true,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(buffer);
        });

        console.log(`   ✅ Success! New URL: ${uploadResult.secure_url}`);

        // Update database
        const materials = await prisma.material.findMany({
          where: {
            content: {
              contains: resource.public_id,
            },
          },
        });

        if (materials.length > 0) {
          console.log(`   📝 Updating ${materials.length} database records...`);
          for (const material of materials) {
            await prisma.material.update({
              where: { id: material.id },
              data: { content: uploadResult.secure_url },
            });
          }
        }
      } catch (error) {
        console.error(`   ❌ Failed:`, error);
      }
    }

    console.log("\n\n✅ All files processed!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

reuploadFiles();
