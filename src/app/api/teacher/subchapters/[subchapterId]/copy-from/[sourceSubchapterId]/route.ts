import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyCourseEditAccess } from "@/lib/course-access";

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

    // Verify target subchapter exists and teacher has edit access
    const targetSub = await prisma.subchapter.findUnique({
      where: { id: subchapterId },
      include: { chapter: { include: { course: true } } },
    });

    if (!targetSub) {
      return NextResponse.json(
        { error: "Docelowy podrozdział nie istnieje" },
        { status: 404 }
      );
    }

    const hasTargetAccess = await verifyCourseEditAccess(targetSub.chapter.courseId, session.user.id);
    if (!hasTargetAccess) {
      return NextResponse.json(
        { error: "Brak uprawnień do edycji docelowego kursu" },
        { status: 403 }
      );
    }

    // Verify source subchapter exists and teacher has edit access (they can copy if they have read/edit access, but let's stick to verifyCourseEditAccess for now or just allow it if they are allowed to see it. Actually OPEN_SOURCE means they can edit it anyway, so verifyCourseEditAccess is correct)
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

    if (!sourceSub) {
      return NextResponse.json(
        { error: "Źródłowy podrozdział nie istnieje" },
        { status: 404 }
      );
    }

    const hasSourceAccess = await verifyCourseEditAccess(sourceSub.chapter.courseId, session.user.id);
    if (!hasSourceAccess) {
      return NextResponse.json(
        { error: "Brak uprawnień do źródłowego kursu" },
        { status: 403 }
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
