// Test script to check available Gemini models
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Czytaj .env ręcznie
const envPath = path.join(__dirname, ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const API_KEY = envContent
  .split("\n")
  .find((line) => line.startsWith("GEMINI_API_KEY="))
  ?.split("=")[1]
  ?.trim()
  ?.replace(/^["']|["']$/g, ""); // Usuń cudzysłowy

if (!API_KEY) {
  console.error("ERROR: GEMINI_API_KEY not found in .env");
  process.exit(1);
}

console.log("API Key found:", API_KEY.substring(0, 10) + "...");
console.log("Full API Key:", API_KEY);
console.log("\nChecking available models...\n");

const genAI = new GoogleGenerativeAI(API_KEY);

// Try to list models
async function testModels() {
  try {
    // Test different model names
    const modelsToTest = [
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "models/gemini-pro",
      "models/gemini-1.5-pro",
      "models/gemini-1.5-flash",
    ];

    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        const text = response.text();
        console.log(
          `✅ ${modelName} - WORKS! Response: ${text.substring(0, 50)}...\n`
        );
      } catch (error) {
        console.log(`❌ ${modelName} - FAILED: ${error.message}\n`);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testModels();
