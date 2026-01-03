import { v2 as cloudinary } from "cloudinary";

// Parse CLOUDINARY_URL using WHATWG URL API (no deprecated url.parse)
function parseCloudinaryUrl(urlString: string) {
  // Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  try {
    // Replace cloudinary:// with https:// to make it a valid URL for parsing
    const tempUrl = urlString.replace("cloudinary://", "https://");
    const url = new URL(tempUrl);

    return {
      api_key: url.username,
      api_secret: url.password,
      cloud_name: url.hostname,
    };
  } catch (error) {
    throw new Error(
      "Invalid CLOUDINARY_URL format. Expected: cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
    );
  }
}

const cloudinaryUrl = process.env.CLOUDINARY_URL;
if (!cloudinaryUrl) {
  throw new Error("CLOUDINARY_URL is not defined in environment variables");
}

const config = parseCloudinaryUrl(cloudinaryUrl);

// Configure cloudinary directly with config object to avoid internal url.parse()
cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
  secure: true,
  // Disable url parsing warnings
  url_analytics: false,
});

export default cloudinary;

// Helper do uploadu plików
export async function uploadToCloudinary(
  file: File,
  folder: string = "mathify"
): Promise<{ url: string; publicId: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Determine resource type based on file type
  let resourceType: "image" | "video" | "raw" = "raw";
  if (file.type.startsWith("image/")) {
    resourceType = "image";
  } else if (file.type.startsWith("video/")) {
    resourceType = "video";
  } else if (file.type === "application/pdf") {
    resourceType = "image"; // PDFs are treated as images in Cloudinary
  }

  return uploadBufferToCloudinary(buffer, file.name, file.type, folder);
}

// Upload buffer directly to Cloudinary (for generated PDFs, converted images, etc.)
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folder: string = "mathify"
): Promise<{ url: string; publicId: string }> {
  // Determine resource type based on MIME type
  let resourceType: "image" | "video" | "raw" = "raw";
  if (mimeType.startsWith("image/")) {
    resourceType = "image";
  } else if (mimeType.startsWith("video/")) {
    resourceType = "video";
  } else if (mimeType === "application/pdf") {
    resourceType = "image"; // PDFs are treated as images in Cloudinary
  }

  // Create unique public_id by adding timestamp to avoid collisions
  // This ensures files with the same name uploaded to different subchapters don't overwrite each other
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  const timestamp = Date.now();
  const uniquePublicId = `${fileNameWithoutExt}_${timestamp}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
          access_mode: "public", // Make files publicly accessible
          type: "upload", // Explicit upload type for public access
          public_id: uniquePublicId, // Use unique public_id with timestamp
        },
        (error, result) => {
          if (error) reject(error);
          else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      )
      .end(buffer);
  });
}

// Helper do usuwania plików
export async function deleteFromCloudinary(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error("Błąd usuwania z Cloudinary:", error);
    return { success: false, error };
  }
}

// Generate signed URL for authenticated files
export function getSignedUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    sign_url: true,
    secure: true,
    resource_type: "image",
    type: "authenticated",
  });
}

export { parseCloudinaryUrl };
