import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // Sprawdź czy uczeń jest zapisany na kurs
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: courseId,
          studentId: session.user.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 404 }
      );
    }

    // Pobierz kurs z rozdziałami, podrozdziałami i materiałami
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        chapters: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            title: true,
            order: true,
            description: true,
            visibility: {
              where: {
                studentId: session.user.id,
              },
              select: {
                isVisible: true,
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
                description: true,
                allowSubmissions: true,
                visibility: {
                  where: {
                    studentId: session.user.id,
                  },
                  select: {
                    isVisible: true,
                    canSubmit: true,
                  },
                },
                materials: {
                  orderBy: {
                    order: "asc",
                  },
                  select: {
                    id: true,
                    title: true,
                    type: true,
                    content: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Przekształć dane do bardziej czytelnego formatu
    const formattedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      teacher: course.teacher,
      chapters: course.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.order,
        description: chapter.description,
        isVisible: chapter.visibility[0]?.isVisible || false,
        subchapters: chapter.subchapters.map((subchapter) => ({
          id: subchapter.id,
          title: subchapter.title,
          order: subchapter.order,
          description: subchapter.description,
          allowSubmissions: subchapter.allowSubmissions,
          isVisible: subchapter.visibility[0]?.isVisible || false,
          canSubmit: subchapter.visibility[0]?.canSubmit || false,
          materials: subchapter.materials,
        })),
      })),
    };

    return NextResponse.json(formattedCourse);
  } catch (error) {
    console.error("Error fetching course details:", error);
    return NextResponse.json(
      { error: "Failed to fetch course details" },
      { status: 500 }
    );
  }
}
