// Test Cloudinary connection
const { parseCloudinaryUrl } = require("./src/lib/cloudinary");

try {
  console.log("Testing Cloudinary configuration...\n");

  const config = parseCloudinaryUrl();

  console.log("✅ CLOUDINARY_URL parsed successfully!");
  console.log("Cloud Name:", config.cloudName);
  console.log("API Key:", config.apiKey.substring(0, 6) + "...");
  console.log("API Secret:", config.apiSecret.substring(0, 6) + "...");

  console.log("\n✅ Configuration is ready!");
  console.log(
    "\nNext steps:\n1. Start dev server: npm run dev\n2. Test upload in browser\n3. Deploy to Vercel"
  );
} catch (error) {
  console.error("❌ Error:", error.message);
  console.log(
    "\nPlease check your .env file and make sure CLOUDINARY_URL is set correctly."
  );
  console.log("Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME");
}
