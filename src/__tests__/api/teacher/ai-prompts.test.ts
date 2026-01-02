import {
  GET as getAIPrompts,
  POST as createAIPrompt,
} from "@/app/api/teacher/ai-prompts/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMockRequest,
  createMockSession,
  getResponseBody,
  mockPrismaAIPromptTemplate,
} from "@/__tests__/utils/test-helpers";

jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    aIPromptTemplate: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("Teacher API - AI Prompts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/teacher/ai-prompts", () => {
    it("should return AI prompts for teacher", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const mockPrompts = [
        mockPrismaAIPromptTemplate({
          id: "prompt-1",
          teacherId: "teacher-id",
          name: "Matematyka Sprawdzanie",
        }),
        mockPrismaAIPromptTemplate({
          id: "prompt-2",
          teacherId: "teacher-id",
          name: "Fizyka Analiza",
        }),
      ];
      (prisma.aIPromptTemplate.findMany as jest.Mock).mockResolvedValue(
        mockPrompts
      );

      const request = createMockRequest("/api/teacher/ai-prompts");
      const response = await getAIPrompts(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.prompts).toHaveLength(2);
      expect(prisma.aIPromptTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teacherId: "teacher-id" },
        })
      );
    });

    it("should deny access to non-teacher users", async () => {
      const studentSession = createMockSession("STUDENT", "student-id");
      (auth as jest.Mock).mockResolvedValue(studentSession);

      const request = createMockRequest("/api/teacher/ai-prompts");
      const response = await getAIPrompts(request);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/teacher/ai-prompts", () => {
    it("should create a new AI prompt template", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const newPrompt = mockPrismaAIPromptTemplate({
        name: "New Prompt",
        prompt: "Sprawdź rozwiązania zadań matematycznych",
      });
      (prisma.aIPromptTemplate.create as jest.Mock).mockResolvedValue(
        newPrompt
      );

      const request = createMockRequest("/api/teacher/ai-prompts", {
        method: "POST",
        body: {
          name: "New Prompt",
          prompt: "Sprawdź rozwiązania zadań matematycznych",
          description: "Template do sprawdzania zadań",
        },
      });

      const response = await createAIPrompt(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(201);
      expect(data.prompt).toBeDefined();
      expect(data.prompt.name).toBe("New Prompt");
      expect(prisma.aIPromptTemplate.create).toHaveBeenCalled();
    });

    it("should require name and prompt fields", async () => {
      const teacherSession = createMockSession("TEACHER", "teacher-id");
      (auth as jest.Mock).mockResolvedValue(teacherSession);

      const request = createMockRequest("/api/teacher/ai-prompts", {
        method: "POST",
        body: {
          description: "Missing name and prompt",
        },
      });

      const response = await createAIPrompt(request);
      const data = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should deny access to non-teacher users", async () => {
      const adminSession = createMockSession("ADMIN", "admin-id");
      (auth as jest.Mock).mockResolvedValue(adminSession);

      const request = createMockRequest("/api/teacher/ai-prompts", {
        method: "POST",
        body: {
          name: "Test",
          prompt: "Test prompt",
        },
      });

      const response = await createAIPrompt(request);

      expect(response.status).toBe(401);
    });
  });
});
