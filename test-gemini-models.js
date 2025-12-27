const { GoogleGenerativeAI } = require("@google/generative-ai");
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

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    console.log("Fetching available models...\n");

    const models = await genAI.listModels();

    console.log("Available models:");
    for (const model of models) {
      console.log("\n---");
      console.log("Name:", model.name);
      console.log("Display Name:", model.displayName);
      console.log("Supported methods:", model.supportedGenerationMethods);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
