import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  sourceCode: z.string().default(""),
  templateId: z.string().cuid().optional(),
});

// POST /api/teacher/latex-documents — create a new LatexDocument
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, templateId } = parsed.data;
  let { sourceCode } = parsed.data;

  // If templateId provided — COPY the source code from the template (never reference live)
  if (templateId) {
    const template = await prisma.latexTemplate.findFirst({
      where: { id: templateId, ownerId: session.user.id },
    });
    if (template) {
      sourceCode = template.sourceCode;
    }
  }

  const document = await prisma.latexDocument.create({
    data: {
      title,
      sourceCode,
      ownerId: session.user.id,
      templateId: templateId ?? null,
    },
  });

  return Response.json({ document }, { status: 201 });
}

// GET /api/teacher/latex-documents — list all documents for the current teacher
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const documents = await prisma.latexDocument.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      title: true,
      materialId: true,
      createdAt: true,
      updatedAt: true,
      material: {
        select: { id: true, title: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json({ documents });
}
