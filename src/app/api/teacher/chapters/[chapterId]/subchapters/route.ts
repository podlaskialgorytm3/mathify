import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { chapterId } = params;
    const body = await request.json();
    const {
      title,
      description,
      order,
      visibilityType,
      visibleFromDate,
      visibleUntilDate,
      requiresPrevious,
      allowSubmissions,
    } = body;

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

    if (!title) {
      return NextResponse.json(
        { error: "Tytuł jest wymagany" },
        { status: 400 }
      );
    }

    // Get next order if not provided
    let subchapterOrder = order;
    if (!subchapterOrder) {
      const lastSubchapter = await prisma.subchapter.findFirst({
        where: { chapterId },
        orderBy: { order: "desc" },
      });
      subchapterOrder = lastSubchapter ? lastSubchapter.order + 1 : 1;
    }

    const subchapter = await prisma.subchapter.create({
      data: {
        title,
        description: description || null,
        order: subchapterOrder,
        chapterId,
        visibilityType: visibilityType || "MANUAL",
        visibleFromDate: visibleFromDate ? new Date(visibleFromDate) : null,
        visibleUntilDate: visibleUntilDate ? new Date(visibleUntilDate) : null,
        requiresPrevious: requiresPrevious || false,
        allowSubmissions: allowSubmissions || false,
      },
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
      message: "Podrozdział został utworzony",
      subchapter,
    });
  } catch (error) {
    console.error("Error creating subchapter:", error);
    return NextResponse.json(
      { error: "Błąd tworzenia podrozdziału" },
      { status: 500 }
    );
  }
}
