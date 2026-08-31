import {
  GET as listElements,
  POST as createElement,
} from "@/app/api/teacher/latex-elements/route";
import {
  PUT as updateElement,
  DELETE as deleteElement,
} from "@/app/api/teacher/latex-elements/[id]/route";
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
    latexElement: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const params = (id: string) => ({ params: Promise.resolve({ id }) });

const mockElement = (overrides: Record<string, any> = {}) => ({
  id: "element-1",
  name: "Kratka do liczb",
  snippetCode: "\\begin{tabular}{|c|c|}\\hline & \\\\\\hline\\end{tabular}",
  ownerId: "teacher-id",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("Teacher API - LaTeX Elements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(
      createMockSession("TEACHER", "teacher-id")
    );
  });

  describe("GET /api/teacher/latex-elements", () => {
    it("returns the teacher's elements including snippet code", async () => {
      (prisma.latexElement.findMany as jest.Mock).mockResolvedValue([
        mockElement(),
      ]);

      const response = await listElements();
      const data = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(data.elements).toHaveLength(1);
      expect(prisma.latexElement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ownerId: "teacher-id" } })
      );
    });

    it("denies access to non-teacher users", async () => {
      (auth as jest.Mock).mockResolvedValue(
        createMockSession("STUDENT", "student-id")
      );

      const response = await listElements();

      expect(response.status).toBe(403);
    });
  });

  describe("POST /api/teacher/latex-elements", () => {
    it("creates an element owned by the current teacher", async () => {
      (prisma.latexElement.create as jest.Mock).mockResolvedValue(
        mockElement()
      );

      const request = createMockRequest("/api/teacher/latex-elements", {
        method: "POST",
        body: { name: "Kratka do liczb", snippetCode: "\\hline" },
      });
      const response = await createElement(request);

      expect(response.status).toBe(201);
      expect(prisma.latexElement.create).toHaveBeenCalledWith({
        data: {
          name: "Kratka do liczb",
          snippetCode: "\\hline",
          ownerId: "teacher-id",
        },
      });
    });

    it("rejects an element without a snippet", async () => {
      const request = createMockRequest("/api/teacher/latex-elements", {
        method: "POST",
        body: { name: "Pusty", snippetCode: "" },
      });
      const response = await createElement(request);

      expect(response.status).toBe(400);
      expect(prisma.latexElement.create).not.toHaveBeenCalled();
    });
  });

  describe("PUT /api/teacher/latex-elements/[id]", () => {
    it("updates the element of its owner", async () => {
      (prisma.latexElement.findUnique as jest.Mock).mockResolvedValue(
        mockElement()
      );
      (prisma.latexElement.update as jest.Mock).mockResolvedValue(
        mockElement({ name: "Ramka" })
      );

      const request = createMockRequest(
        "/api/teacher/latex-elements/element-1",
        { method: "PUT", body: { name: "Ramka" } }
      );
      const response = await updateElement(request, params("element-1"));

      expect(response.status).toBe(200);
      expect(prisma.latexElement.update).toHaveBeenCalledWith({
        where: { id: "element-1" },
        data: { name: "Ramka" },
      });
    });

    it("returns 403 when editing someone else's element", async () => {
      (prisma.latexElement.findUnique as jest.Mock).mockResolvedValue(
        mockElement({ ownerId: "other-teacher" })
      );

      const request = createMockRequest(
        "/api/teacher/latex-elements/element-1",
        { method: "PUT", body: { name: "HACK" } }
      );
      const response = await updateElement(request, params("element-1"));

      expect(response.status).toBe(403);
      expect(prisma.latexElement.update).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/teacher/latex-elements/[id]", () => {
    it("deletes the element of its owner", async () => {
      (prisma.latexElement.findUnique as jest.Mock).mockResolvedValue(
        mockElement()
      );
      (prisma.latexElement.delete as jest.Mock).mockResolvedValue(
        mockElement()
      );

      const request = createMockRequest(
        "/api/teacher/latex-elements/element-1",
        { method: "DELETE" }
      );
      const response = await deleteElement(request, params("element-1"));

      expect(response.status).toBe(204);
      expect(prisma.latexElement.delete).toHaveBeenCalledWith({
        where: { id: "element-1" },
      });
    });

    it("returns 403 when deleting someone else's element", async () => {
      (prisma.latexElement.findUnique as jest.Mock).mockResolvedValue(
        mockElement({ ownerId: "other-teacher" })
      );

      const request = createMockRequest(
        "/api/teacher/latex-elements/element-1",
        { method: "DELETE" }
      );
      const response = await deleteElement(request, params("element-1"));

      expect(response.status).toBe(403);
      expect(prisma.latexElement.delete).not.toHaveBeenCalled();
    });
  });
});
