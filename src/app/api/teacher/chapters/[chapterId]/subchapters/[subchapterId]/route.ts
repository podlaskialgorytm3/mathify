import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { chapterId: string; subchapterId: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { chapterId, subchapterId } = params;
    const body = await request.json();

    // Verify chapter belongs to teacher's course
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: true,
      },
    });

    if (!chapter || chapter.course.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "Rozdział nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    // Verify subchapter belongs to chapter
    const existingSubchapter = await prisma.subchapter.findUnique({
      where: {
        id: subchapterId,
        chapterId,
      },
    });

    if (!existingSubchapter) {
      return NextResponse.json(
        { error: "Podrozdział nie istnieje" },
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
    if (body.allowSubmissions !== undefined)
      updateData.allowSubmissions = body.allowSubmissions;

    const subchapter = await prisma.subchapter.update({
      where: { id: subchapterId },
      data: updateData,
      include: {
        _count: {
          select: {
            materials: true,
            submissions: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Podrozdział zaktualizowany",
      subchapter,
    });
  } catch (error) {
    console.error("Error updating subchapter:", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji podrozdziału" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { chapterId: string; subchapterId: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { chapterId, subchapterId } = params;

    // Verify chapter belongs to teacher's course
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: true,
      },
    });

    if (!chapter || chapter.course.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "Rozdział nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    // Verify subchapter belongs to chapter
    const subchapter = await prisma.subchapter.findUnique({
      where: {
        id: subchapterId,
        chapterId,
      },
    });

    if (!subchapter) {
      return NextResponse.json(
        { error: "Podrozdział nie istnieje" },
        { status: 404 }
      );
    }

    // Delete subchapter (cascade will remove materials)
    await prisma.subchapter.delete({
      where: { id: subchapterId },
    });

    return NextResponse.json({
      message: "Podrozdział został usunięty",
    });
  } catch (error) {
    console.error("Error deleting subchapter:", error);
    return NextResponse.json(
      { error: "Błąd usuwania podrozdziału" },
      { status: 500 }
    );
  }
}
