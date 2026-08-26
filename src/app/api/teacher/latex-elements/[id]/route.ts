import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateElementSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  snippetCode: z.string().min(1).optional(),
});

// PUT /api/teacher/latex-elements/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const { id } = await params;
  const element = await prisma.latexElement.findUnique({ where: { id } });

  if (!element || element.ownerId !== session.user.id) {
    return new Response("Brak dostępu", { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateElementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updated = await prisma.latexElement.update({
    where: { id },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.snippetCode && { snippetCode: parsed.data.snippetCode }),
    },
  });

  return Response.json({ element: updated });
}

// DELETE /api/teacher/latex-elements/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const { id } = await params;
  const element = await prisma.latexElement.findUnique({ where: { id } });

  if (!element || element.ownerId !== session.user.id) {
    return new Response("Brak dostępu", { status: 403 });
  }

  await prisma.latexElement.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
