import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = session.user.id;

    // 1. Pobierz ID kursów należących do tego nauczyciela
    const teacherCourses = await prisma.course.findMany({
      where: {
        teacherId: teacherId,
      },
      select: {
        id: true,
      },
    });

    const courseIds = teacherCourses.map((c) => c.id);

    // 2. Pobierz uczniów zapisanych na te kursy
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        enrolledCourses: {
          some: {
            courseId: {
              in: courseIds,
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        status: true,
      },
      orderBy: {
        lastName: "asc",
      },
    });

    const studentIds = students.map((s) => s.id);

    // 3. Pobierz wyświetlenia materiałów, ale tylko z kursów tego nauczyciela.
    // Relacja: MaterialView -> Material -> MaterialSubchapter -> Subchapter -> Chapter -> Course
    const grouped = await prisma.materialView.groupBy({
      by: ["studentId"],
      where: {
        studentId: { in: studentIds },
        material: {
          subchapters: {
            some: {
              subchapter: {
                chapter: {
                  courseId: { in: courseIds },
                },
              },
            },
          },
        },
      },
      _count: {
        id: true,
      },
    });

    const viewsMap = new Map(grouped.map((g) => [g.studentId, g._count.id]));

    const result = students.map((s) => ({
      ...s,
      totalViews: viewsMap.get(s.id) || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching views summary:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania podsumowania wyświetleń" },
      { status: 500 }
    );
  }
}
