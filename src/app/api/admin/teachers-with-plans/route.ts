import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all teachers with their plans and count of students/subchapters
    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        status: "ACTIVE",
      },
      include: {
        plan: true,
        createdCourses: {
          include: {
            enrollments: true,
            chapters: {
              include: {
                subchapters: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastName: "asc",
      },
    });

    // Calculate statistics for each teacher
    const teachersWithStats = teachers.map((teacher) => {
      const totalStudents = teacher.createdCourses.reduce(
        (sum, course) => sum + course.enrollments.length,
        0
      );

      const totalSubchapters = teacher.createdCourses.reduce(
        (sum, course) =>
          sum +
          course.chapters.reduce(
            (chSum, chapter) => chSum + chapter.subchapters.length,
            0
          ),
        0
      );

      return {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        plan: teacher.plan
          ? {
              id: teacher.plan.id,
              name: teacher.plan.name,
              maxSubchapters: teacher.plan.maxSubchapters,
              maxStudents: teacher.plan.maxStudents,
              price: teacher.plan.price,
              currency: teacher.plan.currency,
            }
          : null,
        stats: {
          totalStudents,
          totalSubchapters,
          coursesCount: teacher.createdCourses.length,
        },
      };
    });

    return NextResponse.json({ teachers: teachersWithStats });
  } catch (error: any) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania nauczycieli" },
      { status: 500 }
    );
  }
}
