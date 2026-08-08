import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Brak ID kursu" },
        { status: 400 }
      );
    }

    // Find original course and verify access
    const originalCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sharedWith: { select: { id: true } },
        chapters: {
          include: {
            subchapters: {
              include: {
                materialSubchapters: true
              }
            }
          }
        }
      }
    });

    if (!originalCourse) {
      return NextResponse.json({ error: "Kurs nie istnieje" }, { status: 404 });
    }

    // Verify it's not already a copy and teacher has access
    if (originalCourse.isSharedCopy) {
      return NextResponse.json({ error: "Nie można sklonować kopii kursu" }, { status: 400 });
    }

    if (
      originalCourse.visibility !== "PUBLIC" &&
      !originalCourse.sharedWith.some(u => u.id === session.user.id)
    ) {
      return NextResponse.json({ error: "Brak dostępu do tego kursu" }, { status: 403 });
    }

    // Start transaction to safely clone everything
    const clonedCourse = await prisma.$transaction(async (tx) => {
      // 1. Create Course
      const newCourse = await tx.course.create({
        data: {
          title: originalCourse.title + " (Kopia)",
          description: originalCourse.description,
          teacherId: session.user.id,
          visibility: "PRIVATE", // New clone is private by default
          isSharedCopy: true,
          originalCourseId: originalCourse.id,
          homeworkFileName: originalCourse.homeworkFileName,
        }
      });

      // 2. Clone Chapters and Subchapters
      for (const chapter of originalCourse.chapters) {
        const newChapter = await tx.chapter.create({
          data: {
            title: chapter.title,
            description: chapter.description,
            order: chapter.order,
            courseId: newCourse.id,
            visibilityType: chapter.visibilityType,
            visibleFromDate: chapter.visibleFromDate,
            visibleUntilDate: chapter.visibleUntilDate,
            requiresPrevious: chapter.requiresPrevious,
          }
        });

        for (const subchapter of chapter.subchapters) {
          const newSubchapter = await tx.subchapter.create({
            data: {
              title: subchapter.title,
              description: subchapter.description,
              order: subchapter.order,
              chapterId: newChapter.id,
              visibilityType: subchapter.visibilityType,
              visibleFromDate: subchapter.visibleFromDate,
              visibleUntilDate: subchapter.visibleUntilDate,
              requiresPrevious: subchapter.requiresPrevious,
              allowSubmissions: subchapter.allowSubmissions,
            }
          });

          // 3. Link original materials
          if (subchapter.materialSubchapters.length > 0) {
            await tx.materialSubchapter.createMany({
              data: subchapter.materialSubchapters.map(ms => ({
                materialId: ms.materialId,
                subchapterId: newSubchapter.id,
                order: ms.order,
              }))
            });
          }
        }
      }

      return newCourse;
    });

    return NextResponse.json({
      message: "Kurs został pomyślnie dodany do Twojego konta",
      course: clonedCourse,
    });
  } catch (error) {
    console.error("Error cloning course:", error);
    return NextResponse.json(
      { error: "Błąd podczas dodawania kursu" },
      { status: 500 }
    );
  }
}
