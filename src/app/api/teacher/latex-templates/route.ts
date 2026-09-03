import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const templateSchema = z.object({
  title: z.string().min(1).max(200),
  sourceCode: z.string().min(1),
});

// GET /api/teacher/latex-templates
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const templates = await prisma.latexTemplate.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
    orderBy: { title: "asc" },
  });

  return Response.json({ templates });
}

// POST /api/teacher/latex-templates
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const template = await prisma.latexTemplate.create({
    data: {
      title: parsed.data.title,
      sourceCode: parsed.data.sourceCode,
      ownerId: session.user.id,
    },
  });

  return Response.json({ template }, { status: 201 });
}
