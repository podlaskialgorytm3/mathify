import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTemplateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  sourceCode: z.string().min(1).optional(),
});

// PUT /api/teacher/latex-templates/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const { id } = await params;
  const template = await prisma.latexTemplate.findUnique({ where: { id } });

  if (!template || template.ownerId !== session.user.id) {
    return new Response("Brak dostępu", { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.latexTemplate.update({
    where: { id },
    data: {
      ...(parsed.data.title && { title: parsed.data.title }),
      ...(parsed.data.sourceCode && { sourceCode: parsed.data.sourceCode }),
    },
  });

  return Response.json({ template: updated });
}

// DELETE /api/teacher/latex-templates/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const { id } = await params;
  const template = await prisma.latexTemplate.findUnique({ where: { id } });

  if (!template || template.ownerId !== session.user.id) {
    return new Response("Brak dostępu", { status: 403 });
  }

  // Note: deleting a template does NOT affect existing LatexDocuments
  // because templateId on LatexDocument is informational only — source code was COPIED
  // The onDelete: SetNull on the relation handles the FK automatically
  await prisma.latexTemplate.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
