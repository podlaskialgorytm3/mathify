import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  sourceCode: z.string().optional(),
});

// GET /api/teacher/latex-documents/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const { id } = await params;
  const document = await prisma.latexDocument.findUnique({
    where: { id },
    include: {
      material: {
        select: { id: true, title: true, content: true },
      },
    },
  });

  if (!document) {
    return Response.json({ error: "Nie znaleziono dokumentu" }, { status: 404 });
  }

  // Owner-only check
  if (document.ownerId !== session.user.id) {
    return new Response("Brak dostępu", { status: 403 });
  }

  return Response.json({ document });
}

// PUT /api/teacher/latex-documents/[id] — update sourceCode and/or title (autosave)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.latexDocument.findUnique({ where: { id } });

  if (!existing) {
    return Response.json({ error: "Nie znaleziono dokumentu" }, { status: 404 });
  }

  if (existing.ownerId !== session.user.id) {
    return new Response("Brak dostępu", { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const document = await prisma.latexDocument.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.sourceCode !== undefined && { sourceCode: parsed.data.sourceCode }),
    },
  });

  return Response.json({ document });
}
