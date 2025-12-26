import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; courseId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, courseId } = await params;

    // Sprawdź czy nauczyciel jest właścicielem kursu
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        teacherId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or unauthorized" },
        { status: 404 }
      );
    }

    // Sprawdź czy uczeń jest zapisany na kurs
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: courseId,
          studentId: studentId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student is not enrolled in this course" },
        { status: 404 }
      );
    }

    // Pobierz dane ucznia
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
      },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    // Pobierz rozdziały z widocznością dla tego ucznia
    const chapters = await prisma.chapter.findMany({
      where: {
        courseId: courseId,
      },
      select: {
        id: true,
        title: true,
        order: true,
        visibility: {
          where: {
            studentId: studentId,
          },
          select: {
            id: true,
            isVisible: true,
            unlockedAt: true,
          },
        },
        subchapters: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            title: true,
            order: true,
            allowSubmissions: true,
            visibility: {
              where: {
                studentId: studentId,
              },
              select: {
                id: true,
                isVisible: true,
                canSubmit: true,
                unlockedAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    // Przekształć dane do bardziej czytelnego formatu
    const formattedChapters = chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      order: chapter.order,
      visibility: chapter.visibility[0] || null,
      subchapters: chapter.subchapters.map((subchapter) => ({
        id: subchapter.id,
        title: subchapter.title,
        order: subchapter.order,
        allowSubmissions: subchapter.allowSubmissions,
        visibility: subchapter.visibility[0] || null,
      })),
    }));

    return NextResponse.json({
      student,
      course,
      chapters: formattedChapters,
    });
  } catch (error) {
    console.error("Error fetching visibility data:", error);
    return NextResponse.json(
      { error: "Failed to fetch visibility data" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string; courseId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, courseId } = await params;
    const body = await request.json();
    const { changes } = body;

    // Sprawdź czy nauczyciel jest właścicielem kursu
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        teacherId: session.user.id,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or unauthorized" },
        { status: 404 }
      );
    }

    // Sprawdź czy uczeń jest zapisany na kurs
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: courseId,
          studentId: studentId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student is not enrolled in this course" },
        { status: 404 }
      );
    }

    // Aktualizuj widoczność w transakcji
    await prisma.$transaction(async (tx) => {
      for (const [id, change] of Object.entries(changes)) {
        const changeData = change as {
          type: "chapter" | "subchapter";
          isVisible?: boolean;
          canSubmit?: boolean;
        };

        if (changeData.type === "chapter") {
          const updateData: { isVisible?: boolean; unlockedAt?: Date | null } =
            {};

          if (changeData.isVisible !== undefined) {
            updateData.isVisible = changeData.isVisible;
            updateData.unlockedAt = changeData.isVisible ? new Date() : null;
          }

          await tx.chapterVisibility.upsert({
            where: {
              chapterId_studentId: {
                chapterId: id,
                studentId: studentId,
              },
            },
            update: updateData,
            create: {
              chapterId: id,
              studentId: studentId,
              isVisible: changeData.isVisible ?? false,
              unlockedAt: changeData.isVisible ? new Date() : null,
            },
          });
        } else if (changeData.type === "subchapter") {
          const updateData: {
            isVisible?: boolean;
            canSubmit?: boolean;
            unlockedAt?: Date | null;
          } = {};

          if (changeData.isVisible !== undefined) {
            updateData.isVisible = changeData.isVisible;
            updateData.unlockedAt = changeData.isVisible ? new Date() : null;
          }

          if (changeData.canSubmit !== undefined) {
            updateData.canSubmit = changeData.canSubmit;
          }

          await tx.subchapterVisibility.upsert({
            where: {
              subchapterId_studentId: {
                subchapterId: id,
                studentId: studentId,
              },
            },
            update: updateData,
            create: {
              subchapterId: id,
              studentId: studentId,
              isVisible: changeData.isVisible ?? false,
              canSubmit: changeData.canSubmit ?? false,
              unlockedAt: changeData.isVisible ? new Date() : null,
            },
          });
        }
      }
    });

    return NextResponse.json({
      message: "Widoczność została zaktualizowana",
      updatedCount: Object.keys(changes).length,
    });
  } catch (error) {
    console.error("Error updating visibility:", error);
    return NextResponse.json(
      { error: "Failed to update visibility" },
      { status: 500 }
    );
  }
}
