import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface TaskResult {
  id: string;
  submissionId: string;
  taskNumber: number;
  pointsEarned: number;
  maxPoints: number;
  comment: string;
}

export interface AICheckResult {
  tasks: TaskResult[];
  rawResponse: string;
}

// Mock AI response for testing
const mockAIResponse = {
  tasks: [
    {
      taskNumber: 1,
      pointsEarned: 8,
      maxPoints: 10,
      comment: "Dobra robota! Drobne błędy w obliczeniach końcowych.",
    },
    {
      taskNumber: 2,
      pointsEarned: 10,
      maxPoints: 10,
      comment: "Perfekcyjne rozwiązanie!",
    },
    {
      taskNumber: 3,
      pointsEarned: 5,
      maxPoints: 10,
      comment: "Błąd w podejściu do problemu. Sprawdź wzór na pole trójkąta.",
    },
  ],
};

export async function checkSubmissionWithAI(
  filePath: string,
  submissionId: string
): Promise<AICheckResult> {
  // If in test mode, return mock data
  if (process.env.AI_TEST_MODE === "true") {
    return {
      tasks: mockAIResponse.tasks.map((task, index) => ({
        id: `mock-${submissionId}-${index}`,
        submissionId,
        ...task,
      })),
      rawResponse: JSON.stringify(mockAIResponse, null, 2),
    };
  }

  try {
    // Read the PDF file
    const fileBuffer = await fs.readFile(filePath);
    const base64File = fileBuffer.toString("base64");

    // Initialize Gemini Pro Vision model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Prepare the prompt
    const prompt = `
      Jesteś doświadczonym nauczycielem matematyki. Przeanalizuj ten plik PDF zawierający rozwiązania zadań matematycznych ucznia.
      
      Dla każdego zadania w pliku:
      1. Zidentyfikuj numer zadania
      2. Oceń poprawność rozwiązania
      3. Przyznaj punkty (maksymalnie 10 punktów za zadanie, chyba że treść zadania wskazuje inaczej)
      4. Dodaj konstruktywny komentarz z wyjaśnieniem błędów lub pochwałą za poprawne rozwiązanie
      
      Zwróć wynik w formacie JSON:
      {
        "tasks": [
          {
            "taskNumber": 1,
            "pointsEarned": 8,
            "maxPoints": 10,
            "comment": "Twój komentarz tutaj"
          }
        ]
      }
      
      Komentarze powinny być w języku polskim, konstruktywne i pomocne dla ucznia.
    `;

    // Generate content with the image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64File,
          mimeType: "application/pdf",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Return a fallback response
      parsedResponse = {
        tasks: [
          {
            taskNumber: 1,
            pointsEarned: 0,
            maxPoints: 10,
            comment:
              "Błąd podczas automatycznej oceny. Nauczyciel sprawdzi pracę ręcznie.",
          },
        ],
      };
    }

    // Transform the response to include submissionId and IDs
    const tasks: TaskResult[] = parsedResponse.tasks.map(
      (task: any, index: number) => ({
        id: `${submissionId}-${index}`,
        submissionId,
        taskNumber: task.taskNumber,
        pointsEarned: task.pointsEarned,
        maxPoints: task.maxPoints,
        comment: task.comment,
      })
    );

    return {
      tasks,
      rawResponse: text,
    };
  } catch (error) {
    console.error("Error checking submission with AI:", error);

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
        },
      ],
      rawResponse: JSON.stringify({ error: (error as Error).message }),
    };
  }
}

export async function recheckSubmissionWithAI(
  filePath: string,
  submissionId: string,
  teacherNotes?: string
): Promise<AICheckResult> {
  // Similar to checkSubmissionWithAI but with additional context from teacher
  const additionalContext = teacherNotes
    ? `\n\nUwagi nauczyciela do ponownej oceny:\n${teacherNotes}`
    : "";

  return checkSubmissionWithAI(filePath, submissionId);
}
