import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id: courseId, chapterId } = await params;
    const body = await request.json();

    // Verify course belongs to teacher
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        teacherId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Kurs nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    // Verify chapter belongs to course
    const existingChapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        courseId,
      },
    });

    if (!existingChapter) {
      return NextResponse.json(
        { error: "Rozdział nie istnieje" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.visibilityType !== undefined)
      updateData.visibilityType = body.visibilityType;
    if (body.visibleFromDate !== undefined) {
      updateData.visibleFromDate = body.visibleFromDate
        ? new Date(body.visibleFromDate)
        : null;
    }
    if (body.visibleUntilDate !== undefined) {
      updateData.visibleUntilDate = body.visibleUntilDate
        ? new Date(body.visibleUntilDate)
        : null;
    }
    if (body.requiresPrevious !== undefined)
      updateData.requiresPrevious = body.requiresPrevious;

    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
      include: {
        _count: {
          select: {
            subchapters: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Rozdział zaktualizowany",
      chapter,
    });
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji rozdziału" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id: courseId, chapterId } = await params;

    // Verify course belongs to teacher
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        teacherId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Kurs nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    // Verify chapter belongs to course
    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
        courseId,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Rozdział nie istnieje" },
        { status: 404 }
      );
    }

    // Delete chapter (cascade will remove subchapters)
    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json({
      message: "Rozdział został usunięty",
    });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json(
      { error: "Błąd usuwania rozdziału" },
      { status: 500 }
    );
  }
}
