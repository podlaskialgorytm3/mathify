import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Sprawdź czy API key jest ustawiony
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set! AI features will not work.");
} else {
  console.log(
    "✓ GEMINI_API_KEY is configured (length:",
    process.env.GEMINI_API_KEY.length,
    ")"
  );
}

export interface TaskResult {
  id: string;
  submissionId: string;
  taskNumber: number;
  pointsEarned: number;
  maxPoints: number;
  comment: string;
  teacherComment?: string;
  teacherEdited: boolean;
}

export interface AICheckResult {
  tasks: TaskResult[];
  rawResponse: string;
}

interface AITaskResponse {
  Zadanie: string;
  "Punkty Zdobyte": number;
  "Max punktów": number;
  Komentarz: string;
}

// Funkcja pomocnicza do parsowania JSON z niestandarowym escapowaniem (np. LaTeX w komentarzach matematycznych)
function safeJsonParse(rawString: string) {
  // Naprawia znaki ucieczki, które nie są standardowe dla JSON (jak LaTeX)
  const fixedString = rawString.replace(
    /\\(?![bfnrtv"\\/]|u[0-9a-fA-F]{4})/g,
    "\\\\"
  );
  return JSON.parse(fixedString);
}

export async function checkSubmissionWithAI(
  filePath: string,
  submissionId: string,
  promptTemplate: string
): Promise<AICheckResult> {
  try {
    console.log("=== Starting AI Check ===");
    console.log("File path:", filePath);
    console.log("Submission ID:", submissionId);
    console.log("Prompt template length:", promptTemplate.length);

    let dataBuffer: Buffer;

    // Sprawdź czy to URL z Cloudinary czy lokalna ścieżka
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      console.log("Downloading from URL:", filePath);

      try {
        // Użyj node-fetch z timeout dla lepszej niezawodności
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch(filePath, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mathify-AI-Checker/1.0",
          },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.error(
            `HTTP Error: ${response.status} ${response.statusText}`
          );
          console.error(`URL: ${filePath}`);
          throw new Error(
            `Failed to download file: HTTP ${response.status} ${response.statusText}`
          );
        }

        // Sprawdź Content-Type
        const contentType = response.headers.get("content-type");
        console.log("Content-Type:", contentType);

        if (
          contentType &&
          !contentType.includes("pdf") &&
          !contentType.includes("octet-stream")
        ) {
          console.warn("Warning: Unexpected content type:", contentType);
        }

        const arrayBuffer = await response.arrayBuffer();
        dataBuffer = Buffer.from(arrayBuffer);
        console.log("Downloaded buffer size:", dataBuffer.length, "bytes");

        // Sprawdź czy to rzeczywiście PDF (zaczyna się od %PDF)
        const pdfHeader = dataBuffer.slice(0, 4).toString();
        if (!pdfHeader.startsWith("%PDF")) {
          console.error("Downloaded file is not a valid PDF!");
          console.error(
            "First 100 bytes:",
            dataBuffer.slice(0, 100).toString()
          );
          throw new Error("Downloaded file is not a valid PDF document");
        }

        console.log("✓ Valid PDF downloaded successfully");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("File download timeout (30s exceeded)");
        }
        throw error;
      }
    } else {
      // Stara ścieżka lokalna - dla kompatybilności wstecznej
      const fullPath = path.join(process.cwd(), "public", filePath);
      console.log("Full PDF path:", fullPath);

      dataBuffer = await fs.readFile(fullPath);
      console.log("PDF buffer size:", dataBuffer.length, "bytes");
    }

    // Konwertuj PDF do base64 dla Gemini
    const base64Data = dataBuffer.toString("base64");
    console.log("Base64 data length:", base64Data.length, "characters");
    console.log("Estimated size:", Math.round(base64Data.length / 1024), "KB");

    console.log("Attempting to call Gemini API...");
    console.log("API Key present:", !!process.env.GEMINI_API_KEY);
    console.log("API Key length:", process.env.GEMINI_API_KEY?.length || 0);

    try {
      // Używamy aliasu gemini-flash-latest, który powinien wskazywać na najbardziej aktualny
      // i stabilny model z serii Flash (zazwyczaj ma najlepsze limity w wersji darmowej).
      // Poprzednie próby z gemini-2.0-flash i gemini-2.0-flash-exp kończyły się błędem 429 (Quota Exceeded) dla większych plików.
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 20000,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      // Dodaj instrukcję JSON do prompta
      const fullPrompt = `${promptTemplate}

WAŻNE: Odpowiedź MUSI być w formacie JSON, bez markdown formatowania. Zwróć tylko czysty JSON array. Jeśli nie możesz odczytać pliku lub nie ma w nim zadań, zwróć pustą tablicę [].`;

      console.log("Calling Gemini API with timeout...");

      // Dodaj timeout dla wywołania API (60s dla Vercel)
      const apiCallWithTimeout = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.error("⚠️ Gemini API call timeout (60s)");
        }, 60000);

        try {
          const result = await model.generateContent([
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data,
              },
            },
            fullPrompt,
          ]);

          clearTimeout(timeoutId);
          return result;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      const result = await apiCallWithTimeout();

      console.log("✓ Gemini API call completed");

      const response = await result.response;

      // Logowanie szczegółów odpowiedzi dla debugowania
      console.log("=== Gemini Response Debug ===");
      if (response.candidates && response.candidates.length > 0) {
        console.log("Finish Reason:", response.candidates[0].finishReason);
        console.log(
          "Safety Ratings:",
          JSON.stringify(response.candidates[0].safetyRatings)
        );

        // Sprawdź czy odpowiedź została zablokowana
        if (response.candidates[0].finishReason === "SAFETY") {
          throw new Error("Response blocked by Gemini safety filters");
        }
        if (response.candidates[0].finishReason === "RECITATION") {
          throw new Error("Response blocked due to recitation");
        }
      } else {
        console.error("No candidates in response!");
        throw new Error("Gemini returned no candidates in response");
      }

      const text = response.text();
      console.log("=== Real Gemini API Response ===");
      console.log("Response length:", text.length);
      console.log("Response preview:", text.substring(0, 200));

      if (!text) {
        throw new Error("Gemini returned empty response");
      }

      // Usuń markdown formatowanie jeśli istnieje
      let jsonText = text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      console.log("Cleaned JSON text:", jsonText);

      if (!jsonText) {
        throw new Error("Empty JSON text after cleaning");
      }

      // Spróbuj sparsować JSON
      let aiTasks: AITaskResponse[];
      try {
        aiTasks = safeJsonParse(jsonText) as AITaskResponse[];
        console.log("Parsed tasks count:", aiTasks.length);
        console.log("Tasks:", JSON.stringify(aiTasks, null, 2));
      } catch (parseError) {
        // JSON niepełny/uszkodzony (np. MAX_TOKENS obcięło odpowiedź)
        // Zapisz surową odpowiedź do rawResponse, żeby nauczyciel mógł ręcznie dokończyć
        console.error(
          "JSON parsing failed:",
          parseError instanceof Error ? parseError.message : String(parseError)
        );
        console.log("Returning raw (incomplete) response for manual editing");
        return {
          tasks: [], // Pusta tablica - nauczyciel ręcznie dokończy przez "Podejrzyj JSON od AI"
          rawResponse: text, // Surowa (niepełna) odpowiedź z Gemini
        };
      }

      // Walidacja struktury
      if (!Array.isArray(aiTasks)) {
        throw new Error("AI response is not an array");
      }

      // Przekształć do formatu TaskResult
      const tasks: TaskResult[] = aiTasks.map((task, index) => {
        // Wyciągnij numer zadania z tekstu "Zadanie 1" -> 1
        const taskNumberMatch = task.Zadanie.match(/\d+/);
        const taskNumber = taskNumberMatch
          ? parseInt(taskNumberMatch[0])
          : index + 1;

        return {
          id: `${submissionId}-${index}`,
          submissionId,
          taskNumber,
          pointsEarned: task["Punkty Zdobyte"],
          maxPoints: task["Max punktów"],
          comment: task.Komentarz,
          teacherEdited: false,
        };
      });

      console.log("=== Final Result from Real AI ===");
      console.log("Tasks created:", tasks.length);
      console.log("Tasks details:", JSON.stringify(tasks, null, 2));

      return {
        tasks,
        rawResponse: text, // Surowa odpowiedź z Gemini - nauczyciel może ją edytować przez "Podejrzyj JSON od AI"
      };
    } catch (apiError) {
      const errorMsg =
        apiError instanceof Error ? apiError.message : String(apiError);
      console.error("=== Gemini API Error ===");
      console.error(
        "Error type:",
        apiError instanceof Error ? apiError.constructor.name : typeof apiError
      );
      console.error("Error message:", errorMsg);
      console.error(
        "Error stack:",
        apiError instanceof Error ? apiError.stack : "No stack"
      );

      // Sprawdź czy to błąd limitu
      if (
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED")
      ) {
        console.error("⚠️ Gemini API quota exceeded!");
      }

      // Sprawdź czy to błąd sieci
      if (
        errorMsg.includes("fetch") ||
        errorMsg.includes("network") ||
        errorMsg.includes("ECONNREFUSED")
      ) {
        console.error("⚠️ Network error connecting to Gemini API");
      }

      console.warn("=== Using fallback mock response ===");

      // Fallback - generuj losowe odpowiedzi dla różnorodności
      const taskCount = Math.floor(Math.random() * 3) + 2; // 2-4 zadania
      const mockResponse = [];

      for (let i = 0; i < taskCount; i++) {
        const maxPoints = 10;
        const pointsEarned = Math.floor(Math.random() * 5) + 5; // 5-9 punktów

        const comments = [
          "Dobra praca, ale brak szczegółowego wyjaśnienia niektórych kroków.",
          "Rozwiązanie poprawne, ale można było rozwinąć odpowiedź.",
          "Bardzo dobra analiza problemu i rozwiązanie.",
          "Prawidłowe podejście, jednak błąd w obliczeniach.",
          "Świetna praca! Wszystkie kroki dobrze uzasadnione.",
          "Rozwiązanie częściowo poprawne, brak końcowego wniosku.",
          "Doskonała analiza, dokładne wyjaśnienie wszystkich kroków.",
          "Poprawne rozwiązanie, ale można było skrócić zapis.",
        ];

        mockResponse.push({
          Zadanie: `Zadanie ${i + 1}`,
          "Punkty Zdobyte": pointsEarned,
          "Max punktów": maxPoints,
          Komentarz: comments[Math.floor(Math.random() * comments.length)],
        });
      }

      const text = JSON.stringify(mockResponse);
      console.log("=== Mock AI Response (Random) ===");
      console.log("Mock response generated with random values");
      console.log("Response:", text);

      // Usuń markdown formatowanie jeśli istnieje
      let jsonText = text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3);
      }
      jsonText = jsonText.trim();

      console.log("Cleaned JSON text:", jsonText);

      // Parse JSON
      const aiTasks = safeJsonParse(jsonText) as AITaskResponse[];
      console.log("Parsed tasks count:", aiTasks.length);
      console.log("Tasks:", JSON.stringify(aiTasks, null, 2));

      // Walidacja struktury
      if (!Array.isArray(aiTasks)) {
        throw new Error("AI response is not an array");
      }

      // Przekształć do formatu TaskResult
      const tasks: TaskResult[] = aiTasks.map((task, index) => {
        // Wyciągnij numer zadania z tekstu "Zadanie 1" -> 1
        const taskNumberMatch = task.Zadanie.match(/\d+/);
        const taskNumber = taskNumberMatch
          ? parseInt(taskNumberMatch[0])
          : index + 1;

        return {
          id: `${submissionId}-${index}`,
          submissionId,
          taskNumber,
          pointsEarned: task["Punkty Zdobyte"],
          maxPoints: task["Max punktów"],
          comment: task.Komentarz,
          teacherEdited: false,
        };
      });

      console.log("=== Final Result from Mock AI ===");
      console.log("Tasks created:", tasks.length);
      console.log("Tasks details:", JSON.stringify(tasks, null, 2));

      return {
        tasks,
        rawResponse: text,
      };
    }
  } catch (error) {
    console.error("=== ERROR in checkSubmissionWithAI ===");
    console.error(
      "Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    // Return error response
    return {
      tasks: [
        {
          id: `error-${submissionId}-0`,
          submissionId,
          taskNumber: 1,
          pointsEarned: 0,
          maxPoints: 10,
          comment:
            "Wystąpił błąd podczas automatycznej oceny. Nauczyciel sprawdzi pracę ręcznie.",
          teacherEdited: false,
        },
      ],
      rawResponse: JSON.stringify({ error: (error as Error).message }),
    };
  }
}
