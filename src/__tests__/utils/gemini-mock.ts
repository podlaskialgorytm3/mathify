/**
 * Mock for @google/generative-ai
 */

export class MockGenerativeModel {
  private modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  async generateContent(prompt: string | any) {
    return {
      response: {
        text: () => {
          return JSON.stringify({
            tasks: [
              {
                taskNumber: 1,
                pointsEarned: 8,
                maxPoints: 10,
                comment: "Dobre rozwiązanie. Mała pomyłka w obliczeniach.",
              },
              {
                taskNumber: 2,
                pointsEarned: 10,
                maxPoints: 10,
                comment: "Perfekcyjne!",
              },
            ],
            generalComment: "Świetna praca! Kontynuuj w tym stylu.",
          });
        },
      },
    };
  }
}

export class MockGoogleGenerativeAI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getGenerativeModel(options: { model: string }) {
    return new MockGenerativeModel(options.model);
  }
}

export const mockGeminiResponse = {
  tasks: [
    {
      taskNumber: 1,
      pointsEarned: 8,
      maxPoints: 10,
      comment: "Dobre rozwiązanie",
    },
  ],
  generalComment: "Dobra praca",
};
