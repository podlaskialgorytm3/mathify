import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request: NextRequest) {
  try {
    console.log("=== Testing Gemini API ===");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    console.log("API Key length:", apiKey.length);
    console.log("API Key prefix:", apiKey.substring(0, 10) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    console.log("Sending test request to Gemini...");

    const result = await model.generateContent(
      'Say hello in JSON format: {"message": "hello"}'
    );
    const response = await result.response;
    const text = response.text();

    console.log("✓ Gemini API responded successfully");
    console.log("Response:", text);

    return NextResponse.json({
      success: true,
      apiKeyConfigured: true,
      apiKeyLength: apiKey.length,
      response: text,
      model: "gemini-flash-latest",
    });
  } catch (error) {
    console.error("Error testing Gemini API:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
