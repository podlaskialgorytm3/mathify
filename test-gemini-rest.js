const https = require("https");
const fs = require("fs");
const path = require("path");

// Czytaj .env ręcznie
const envPath = path.join(__dirname, ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const apiKey = envContent
  .split("\n")
  .find((line) => line.startsWith("GEMINI_API_KEY="))
  ?.split("=")[1]
  ?.trim()
  ?.replace(/^["']|["']$/g, ""); // Usuń cudzysłowy

if (!apiKey) {
  console.error("ERROR: GEMINI_API_KEY not found in .env");
  process.exit(1);
}
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https
  .get(url, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        if (json.error) {
          console.error("API Error:", json.error.message);
        } else {
          console.log("Available Models:");
          if (json.models) {
            json.models.forEach((model) => {
              console.log(`- ${model.name} (${model.displayName})`);
              console.log(
                `  Supported methods: ${model.supportedGenerationMethods}`
              );
            });
          } else {
            console.log("No models found or unexpected format:", json);
          }
        }
      } catch (e) {
        console.error("Error parsing JSON:", e.message);
        console.log("Raw response:", data);
      }
    });
  })
  .on("error", (err) => {
    console.error("Error: " + err.message);
  });
