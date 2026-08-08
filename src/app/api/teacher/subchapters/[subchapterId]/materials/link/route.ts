import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  materialId: z.string().cuid(),
});

// POST /api/teacher/subchapters/[subchapterId]/materials/link
// Podpięcie istniejącego materiału (referencja) do podrozdziału
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subchapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { subchapterId } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "materialId jest wymagany i musi być poprawnym CUID" },
        { status: 400 }
      );
    }

    const { materialId } = parsed.data;

    // Verify target subchapter belongs to teacher's course
    const subchapter = await prisma.subchapter.findUnique({
      where: { id: subchapterId },
      include: { chapter: { include: { course: true } } },
    });

    if (!subchapter || subchapter.chapter.course.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "Podrozdział nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    // Verify teacher owns the material
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Materiał nie istnieje" },
        { status: 404 }
      );
    }

    if (material.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Możesz linkować tylko własne materiały" },
        { status: 403 }
      );
    }

    // Get next order for this subchapter
    const lastEntry = await prisma.materialSubchapter.findFirst({
      where: { subchapterId },
      orderBy: { order: "desc" },
    });
    const order = lastEntry ? lastEntry.order + 1 : 1;

    // Create the link
    const link = await prisma.materialSubchapter.create({
      data: { materialId, subchapterId, order },
    });

    return NextResponse.json({
      message: "Materiał został podpięty do podrozdziału",
      link,
    });
  } catch (error: unknown) {
    // Handle unique constraint violation (already linked)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "Materiał jest już przypisany do tego podrozdziału" },
        { status: 409 }
      );
    }
    console.error("Error linking material:", error);
    return NextResponse.json(
      { error: "Błąd podczas podpinania materiału" },
      { status: 500 }
    );
  }
}
