const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyCkB7K4ftwBdGMF0ca7c7dadrAkzRAmwFE";
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
