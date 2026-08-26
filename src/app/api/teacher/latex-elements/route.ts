import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const elementSchema = z.object({
  name: z.string().min(1).max(200),
  snippetCode: z.string().min(1),
});

// GET /api/teacher/latex-elements
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const elements = await prisma.latexElement.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, snippetCode: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ elements });
}

// POST /api/teacher/latex-elements
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = elementSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const element = await prisma.latexElement.create({
    data: {
      name: parsed.data.name,
      snippetCode: parsed.data.snippetCode,
      ownerId: session.user.id,
    },
  });

  return Response.json({ element }, { status: 201 });
}
