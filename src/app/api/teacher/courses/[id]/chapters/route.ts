import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id: courseId } = params;
    const body = await request.json();
    const {
      title,
      description,
      order,
      visibilityType,
      visibleFromDate,
      visibleUntilDate,
      requiresPrevious,
    } = body;

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

    if (!title) {
      return NextResponse.json(
        { error: "Tytuł jest wymagany" },
        { status: 400 }
      );
    }

    // Get next order if not provided
    let chapterOrder = order;
    if (!chapterOrder) {
      const lastChapter = await prisma.chapter.findFirst({
        where: { courseId },
        orderBy: { order: "desc" },
      });
      chapterOrder = lastChapter ? lastChapter.order + 1 : 1;
    }

    const chapter = await prisma.chapter.create({
      data: {
        title,
        description: description || null,
        order: chapterOrder,
        courseId,
        visibilityType: visibilityType || "MANUAL",
        visibleFromDate: visibleFromDate ? new Date(visibleFromDate) : null,
        visibleUntilDate: visibleUntilDate ? new Date(visibleUntilDate) : null,
        requiresPrevious: requiresPrevious || false,
      },
      include: {
        _count: {
          select: {
            subchapters: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Rozdział został utworzony",
      chapter,
    });
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json(
      { error: "Błąd tworzenia rozdziału" },
      { status: 500 }
    );
  }
}
