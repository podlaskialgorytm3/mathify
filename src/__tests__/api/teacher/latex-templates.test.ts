import {
  GET as listTemplates,
  POST as createTemplate,
} from "@/app/api/teacher/latex-templates/route";
import {
  GET as getTemplate,
  PUT as updateTemplate,
  DELETE as deleteTemplate,
} from "@/app/api/teacher/latex-templates/[id]/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createMockRequest,
  createMockSession,
  getResponseBody,
} from "@/__tests__/utils/test-helpers";

jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    latexTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const params = (id: string) => ({ params: Promise.resolve({ id }) });

const mockTemplate = (overrides: Record<string, any> = {}) => ({
  id: "template-1",
  title: "Karta pracy",
  sourceCode: "\\documentclass{article}\\begin{document}A\\end{document}",
  ownerId: "teacher-id",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("Teacher API - LaTeX Templates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(
      createMockSession("TEACHER", "teacher-id")
    );
  });

  describe("GET /api/teacher/latex-templates", () => {
    it("returns only the teacher's own templates", async () => {
      (prisma.latexTemplate.findMany as jest.Mock).mockResolvedValue([
        mockTemplate(),
      ]);

      const response = await listTemplates();
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.templates).toHaveLength(1);
      expect(prisma.latexTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId: "teacher-id" } })
      );
    });

    it("denies access to non-teacher users", async () => {
      (auth as jest.Mock).mockResolvedValue(
        createMockSession("STUDENT", "student-id")
      );

      const response = await listTemplates();

      expect(response.status).toBe(403);
      expect(prisma.latexTemplate.findMany).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/teacher/latex-templates", () => {
    it("creates a template owned by the current teacher", async () => {
      (prisma.latexTemplate.create as jest.Mock).mockResolvedValue(
        mockTemplate()
      );

      const request = createMockRequest("/api/teacher/latex-templates", {
        method: "POST",
        body: { title: "Karta pracy", sourceCode: "\\documentclass{article}" },
      });
      const response = await createTemplate(request);

      expect(response.status).toBe(201);
      expect(prisma.latexTemplate.create).toHaveBeenCalledWith({
        data: {
          title: "Karta pracy",
          sourceCode: "\\documentclass{article}",
          ownerId: "teacher-id",
        },
      });
    });

    it("rejects invalid payloads", async () => {
      const request = createMockRequest("/api/teacher/latex-templates", {
        method: "POST",
        body: { title: "", sourceCode: "" },
      });
      const response = await createTemplate(request);

      expect(response.status).toBe(400);
      expect(prisma.latexTemplate.create).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/teacher/latex-templates/[id]", () => {
    it("returns the template source code for its owner", async () => {
      (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate()
      );

      const request = createMockRequest(
        "/api/teacher/latex-templates/template-1"
      );
      const response = await getTemplate(request, params("template-1"));
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.template.sourceCode).toContain("\\documentclass{article}");
    });

    it("returns 404 when the template does not exist", async () => {
      (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest("/api/teacher/latex-templates/missing");
      const response = await getTemplate(request, params("missing"));

      expect(response.status).toBe(404);
    });

    it("returns 403 for a template owned by someone else", async () => {
      (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate({ ownerId: "other-teacher" })
      );

      const request = createMockRequest(
        "/api/teacher/latex-templates/template-1"
      );
      const response = await getTemplate(request, params("template-1"));

      expect(response.status).toBe(403);
    });
  });

  describe("PUT /api/teacher/latex-templates/[id]", () => {
    it("updates the template of its owner", async () => {
      (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate()
      );
      (prisma.latexTemplate.update as jest.Mock).mockResolvedValue(
        mockTemplate({ sourceCode: "NOWY KOD" })
      );

      const request = createMockRequest(
        "/api/teacher/latex-templates/template-1",
        { method: "PUT", body: { sourceCode: "NOWY KOD" } }
      );
      const response = await updateTemplate(request, params("template-1"));

      expect(response.status).toBe(200);
      expect(prisma.latexTemplate.update).toHaveBeenCalledWith({
        where: { id: "template-1" },
        data: { sourceCode: "NOWY KOD" },
      });
    });

    it("returns 403 when editing someone else's template", async () => {
      (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate({ ownerId: "other-teacher" })
      );

      const request = createMockRequest(
        "/api/teacher/latex-templates/template-1",
        { method: "PUT", body: { sourceCode: "HACK" } }
      );
      const response = await updateTemplate(request, params("template-1"));

      expect(response.status).toBe(403);
      expect(prisma.latexTemplate.update).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/teacher/latex-templates/[id]", () => {
    it("deletes the template of its owner", async () => {
      (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate()
      );
      (prisma.latexTemplate.delete as jest.Mock).mockResolvedValue(
        mockTemplate()
      );

      const request = createMockRequest(
        "/api/teacher/latex-templates/template-1",
        { method: "DELETE" }
      );
      const response = await deleteTemplate(request, params("template-1"));

      expect(response.status).toBe(204);
      expect(prisma.latexTemplate.delete).toHaveBeenCalledWith({
        where: { id: "template-1" },
      });
    });

    it("returns 403 when deleting someone else's template", async () => {
      (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue(
        mockTemplate({ ownerId: "other-teacher" })
      );

      const request = createMockRequest(
        "/api/teacher/latex-templates/template-1",
        { method: "DELETE" }
      );
      const response = await deleteTemplate(request, params("template-1"));

      expect(response.status).toBe(403);
      expect(prisma.latexTemplate.delete).not.toHaveBeenCalled();
    });
  });
});
