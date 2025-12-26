import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: {
        id,
        teacherId: session.user.id, // Only teacher's own courses
      },
      include: {
        chapters: {
          include: {
            subchapters: {
              include: {
                materials: {
                  orderBy: {
                    order: "asc",
                  },
                },
                _count: {
                  select: {
                    materials: true,
                    submissions: true,
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
            _count: {
              select: {
                subchapters: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Kurs nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Błąd pobierania kursu" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description } = body;

    // Check if course belongs to teacher
    const existingCourse = await prisma.course.findUnique({
      where: {
        id,
        teacherId: session.user.id,
      },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: "Kurs nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            chapters: true,
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Kurs zaktualizowany",
      course,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji kursu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    // Check if course belongs to teacher
    const course = await prisma.course.findUnique({
      where: {
        id,
        teacherId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Kurs nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    // Delete course (cascade will remove related data)
    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Kurs został usunięty",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Błąd usuwania kursu" }, { status: 500 });
  }
}
