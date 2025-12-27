import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Sprawdź czy kurs należy do nauczyciela
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        teacherId: session.user.id,
      },
      include: {
        chapters: {
          include: {
            subchapters: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Sprawdź czy uczeń istnieje i ma rolę STUDENT
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
        role: "STUDENT",
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Sprawdź czy uczeń już jest zapisany na kurs
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Student is already enrolled in this course" },
        { status: 400 }
      );
    }

    // Check plan limits if teacher has a plan
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        plan: true,
        createdCourses: {
          include: {
            enrollments: true,
          },
        },
      },
    });

    if (teacher?.plan) {
      const totalStudents = teacher.createdCourses.reduce(
        (sum, course) => sum + course.enrollments.length,
        0
      );

      if (totalStudents + 1 > teacher.plan.maxStudents) {
        return NextResponse.json(
          {
            error: `Przekroczono limit uczniów. Twój plan ${teacher.plan.name} pozwala na maksymalnie ${teacher.plan.maxStudents} uczniów. Aktualnie masz ${totalStudents} uczniów.`,
          },
          { status: 403 }
        );
      }
    }

    // Użyj transakcji do zapisania ucznia i utworzenia ustawień widoczności
    await prisma.$transaction(async (tx: any) => {
      // 1. Utwórz enrollment
      await tx.courseEnrollment.create({
        data: {
          courseId,
          studentId,
        },
      });

      // 2. Utwórz ustawienia widoczności dla każdego rozdziału
      const now = new Date();
      const chapterVisibilityData = [];
      const subchapterVisibilityData = [];

      for (const chapter of course.chapters) {
        // Ustal czy rozdział jest widoczny
        let isChapterVisible = false;
        let chapterUnlockedAt = null;

        if (chapter.visibilityType === "MANUAL") {
          // Ręczna widoczność - domyślnie niewidoczny
          isChapterVisible = false;
        } else if (chapter.visibilityType === "DATE_BASED") {
          // Bazująca na dacie
          const fromDate = chapter.visibleFromDate;
          const untilDate = chapter.visibleUntilDate;

          if (fromDate && now >= fromDate) {
            if (!untilDate || now <= untilDate) {
              isChapterVisible = true;
              chapterUnlockedAt = fromDate;
            }
          }
        } else if (chapter.visibilityType === "PROGRESS_BASED") {
          // Bazująca na postępie
          if (chapter.order === 1) {
            // Pierwszy rozdział zawsze widoczny
            isChapterVisible = true;
            chapterUnlockedAt = now;
          } else {
            // Inne rozdziały wymagają ukończenia poprzedniego
            isChapterVisible = false;
          }
        }

        chapterVisibilityData.push({
          chapterId: chapter.id,
          studentId,
          isVisible: isChapterVisible,
          unlockedAt: chapterUnlockedAt,
        });

        // 3. Utwórz ustawienia widoczności dla podrozdziałów
        for (const subchapter of chapter.subchapters) {
          let isSubchapterVisible = false;
          let subchapterUnlockedAt = null;

          // Podrozdział może być widoczny tylko jeśli rozdział jest widoczny
          if (isChapterVisible) {
            if (subchapter.visibilityType === "MANUAL") {
              isSubchapterVisible = false;
            } else if (subchapter.visibilityType === "DATE_BASED") {
              const fromDate = subchapter.visibleFromDate;
              const untilDate = subchapter.visibleUntilDate;

              if (fromDate && now >= fromDate) {
                if (!untilDate || now <= untilDate) {
                  isSubchapterVisible = true;
                  subchapterUnlockedAt = fromDate;
                }
              }
            } else if (subchapter.visibilityType === "PROGRESS_BASED") {
              if (subchapter.order === 1) {
                // Pierwszy podrozdział widoczny
                isSubchapterVisible = true;
                subchapterUnlockedAt = now;
              } else {
                isSubchapterVisible = false;
              }
            }
          }

          subchapterVisibilityData.push({
            subchapterId: subchapter.id,
            studentId,
            isVisible: isSubchapterVisible,
            unlockedAt: subchapterUnlockedAt,
          });
        }
      }

      // Wstaw wszystkie ustawienia widoczności jednocześnie
      if (chapterVisibilityData.length > 0) {
        await tx.chapterVisibility.createMany({
          data: chapterVisibilityData,
        });
      }

      if (subchapterVisibilityData.length > 0) {
        await tx.subchapterVisibility.createMany({
          data: subchapterVisibilityData,
        });
      }
    });

    return NextResponse.json({
      message:
        "Uczeń został zapisany na kurs z indywidualnymi ustawieniami widoczności",
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    return NextResponse.json(
      { error: "Failed to enroll student" },
      { status: 500 }
    );
  }
}
