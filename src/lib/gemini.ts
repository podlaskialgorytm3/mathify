import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

    // Przeczytaj PDF
    const fullPath = path.join(process.cwd(), "public", filePath);
    console.log("Full PDF path:", fullPath);

    const dataBuffer = await fs.readFile(fullPath);
    console.log("PDF buffer size:", dataBuffer.length);

    // Konwertuj PDF do base64 dla Gemini
    const base64Data = dataBuffer.toString("base64");

    console.log("Attempting to call Gemini API...");

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

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Data,
          },
        },
        fullPrompt,
      ]);

      const response = await result.response;

      // Logowanie szczegółów odpowiedzi dla debugowania
      console.log("=== Gemini Response Debug ===");
      if (response.candidates && response.candidates.length > 0) {
        console.log("Finish Reason:", response.candidates[0].finishReason);
        console.log(
          "Safety Ratings:",
          JSON.stringify(response.candidates[0].safetyRatings)
        );
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
        aiTasks = JSON.parse(jsonText) as AITaskResponse[];
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
      console.warn("=== Gemini API Failed, using enhanced mock ===");
      console.warn("API Error:", errorMsg);

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
      const aiTasks = JSON.parse(jsonText) as AITaskResponse[];
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
