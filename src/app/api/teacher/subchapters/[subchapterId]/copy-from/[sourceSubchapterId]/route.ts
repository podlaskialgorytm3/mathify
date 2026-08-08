import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/teacher/subchapters/[subchapterId]/copy-from/[sourceSubchapterId]
// Skopiowanie (przez referencje) wszystkich materiałów ze źródłowego podrozdziału
export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      subchapterId: string;
      sourceSubchapterId: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { subchapterId, sourceSubchapterId } = await params;

    if (subchapterId === sourceSubchapterId) {
      return NextResponse.json(
        { error: "Nie można kopiować podrozdziału do samego siebie" },
        { status: 400 }
      );
    }

    // Verify target subchapter belongs to teacher
    const targetSub = await prisma.subchapter.findUnique({
      where: { id: subchapterId },
      include: { chapter: { include: { course: true } } },
    });

    if (!targetSub || targetSub.chapter.course.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "Docelowy podrozdział nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    // Verify source subchapter belongs to teacher
    const sourceSub = await prisma.subchapter.findUnique({
      where: { id: sourceSubchapterId },
      include: {
        chapter: { include: { course: true } },
        materialSubchapters: {
          orderBy: { order: "asc" },
          include: { material: true },
        },
      },
    });

    if (!sourceSub || sourceSub.chapter.course.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "Źródłowy podrozdział nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    if (sourceSub.materialSubchapters.length === 0) {
      return NextResponse.json(
        { message: "Źródłowy podrozdział nie ma materiałów", copied: 0 },
        { status: 200 }
      );
    }

    // Get current max order for target subchapter
    const lastEntry = await prisma.materialSubchapter.findFirst({
      where: { subchapterId },
      orderBy: { order: "desc" },
    });
    let nextOrder = lastEntry ? lastEntry.order + 1 : 1;

    // Create references for each material from source subchapter
    let copied = 0;
    for (const entry of sourceSub.materialSubchapters) {
      try {
        await prisma.materialSubchapter.create({
          data: {
            materialId: entry.materialId,
            subchapterId,
            order: nextOrder++,
          },
        });
        copied++;
      } catch {
        // Skip if already linked (unique constraint)
      }
    }

    return NextResponse.json({
      message: `Skopiowano ${copied} materiałów do podrozdziału`,
      copied,
    });
  } catch (error) {
    console.error("Error copying subchapter materials:", error);
    return NextResponse.json(
      { error: "Błąd podczas kopiowania materiałów" },
      { status: 500 }
    );
  }
}
