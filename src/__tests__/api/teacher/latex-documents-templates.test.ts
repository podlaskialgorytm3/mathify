import { POST as createDocument } from "@/app/api/teacher/latex-documents/route";
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
    latexDocument: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    latexTemplate: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const TEMPLATE_ID = "ctemplate000000000000001";
const TEMPLATE_CODE =
  "\\documentclass{article}\n\\begin{document}\nSZABLON\n\\end{document}";

describe("Teacher API - creating a LaTeX document from a template", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue(
      createMockSession("TEACHER", "teacher-id")
    );
  });

  it("copies the template source code into the new document", async () => {
    (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue({
      id: TEMPLATE_ID,
      title: "Karta pracy",
      sourceCode: TEMPLATE_CODE,
      ownerId: "teacher-id",
    });
    (prisma.latexDocument.create as jest.Mock).mockImplementation(
      async ({ data }: any) => ({ id: "doc-1", ...data })
    );

    const request = createMockRequest("/api/teacher/latex-documents", {
      method: "POST",
      body: { title: "Nowy materiał", templateId: TEMPLATE_ID },
    });
    const response = await createDocument(request);
    const data = await getResponseBody(response);

    expect(response.status).toBe(201);
    expect(data.document.sourceCode).toBe(TEMPLATE_CODE);
    expect(prisma.latexDocument.create).toHaveBeenCalledWith({
      data: {
        title: "Nowy materiał",
        sourceCode: TEMPLATE_CODE,
        ownerId: "teacher-id",
        templateId: TEMPLATE_ID,
      },
    });
  });

  it("keeps the document code unchanged when the template is edited afterwards", async () => {
    (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue({
      id: TEMPLATE_ID,
      sourceCode: TEMPLATE_CODE,
      ownerId: "teacher-id",
    });

    const createdDocuments: any[] = [];
    (prisma.latexDocument.create as jest.Mock).mockImplementation(
      async ({ data }: any) => {
        const doc = { id: "doc-1", ...data };
        createdDocuments.push(doc);
        return doc;
      }
    );

    const request = createMockRequest("/api/teacher/latex-documents", {
      method: "POST",
      body: { title: "Materiał", templateId: TEMPLATE_ID },
    });
    await createDocument(request);

    // Template is edited later — the document keeps its own copy of the code
    (prisma.latexTemplate.update as jest.Mock).mockResolvedValue({
      id: TEMPLATE_ID,
      sourceCode: "ZUPEŁNIE INNY KOD",
      ownerId: "teacher-id",
    });
    await prisma.latexTemplate.update({
      where: { id: TEMPLATE_ID },
      data: { sourceCode: "ZUPEŁNIE INNY KOD" },
    });

    expect(createdDocuments[0].sourceCode).toBe(TEMPLATE_CODE);
  });

  it("returns 403 when the template belongs to another teacher", async () => {
    (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue({
      id: TEMPLATE_ID,
      sourceCode: TEMPLATE_CODE,
      ownerId: "other-teacher",
    });

    const request = createMockRequest("/api/teacher/latex-documents", {
      method: "POST",
      body: { title: "Materiał", templateId: TEMPLATE_ID },
    });
    const response = await createDocument(request);

    expect(response.status).toBe(403);
    expect(prisma.latexDocument.create).not.toHaveBeenCalled();
  });

  it("returns 404 when the template does not exist", async () => {
    (prisma.latexTemplate.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest("/api/teacher/latex-documents", {
      method: "POST",
      body: { title: "Materiał", templateId: TEMPLATE_ID },
    });
    const response = await createDocument(request);

    expect(response.status).toBe(404);
    expect(prisma.latexDocument.create).not.toHaveBeenCalled();
  });

  it("creates an empty document when no template is chosen", async () => {
    (prisma.latexDocument.create as jest.Mock).mockImplementation(
      async ({ data }: any) => ({ id: "doc-2", ...data })
    );

    const request = createMockRequest("/api/teacher/latex-documents", {
      method: "POST",
      body: { title: "Pusty materiał", sourceCode: "" },
    });
    const response = await createDocument(request);

    expect(response.status).toBe(201);
    expect(prisma.latexTemplate.findUnique).not.toHaveBeenCalled();
    expect(prisma.latexDocument.create).toHaveBeenCalledWith({
      data: {
        title: "Pusty materiał",
        sourceCode: "",
        ownerId: "teacher-id",
        templateId: null,
      },
    });
  });
});
