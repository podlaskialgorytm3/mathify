import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");

    // Pobierz kursy nauczyciela
    const teacherCourses = await prisma.course.findMany({
      where: {
        teacherId: session.user.id,
      },
      select: {
        id: true,
        title: true,
      },
    });

    const courseIds = teacherCourses.map((c) => c.id);

    // Buduj zapytanie dla uczniów
    const whereClause: any = {
      role: "STUDENT",
      enrolledCourses: {
        some: {
          courseId: {
            in: courseIds,
          },
        },
      },
    };

    // Filtruj po konkretnym kursie jeśli podano
    if (courseId) {
      whereClause.enrolledCourses = {
        some: {
          courseId: courseId,
        },
      };
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        status: true,
        createdAt: true,
        enrolledCourses: {
          where: courseId
            ? {
                courseId: courseId,
              }
            : {
                courseId: {
                  in: courseIds,
                },
              },
          select: {
            enrolledAt: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        submissions: {
          where: {
            subchapter: {
              chapter: {
                courseId: courseId
                  ? courseId
                  : {
                      in: courseIds,
                    },
              },
            },
          },
          select: {
            id: true,
            status: true,
            score: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        lastName: "asc",
      },
    });

    // Oblicz statystyki dla każdego ucznia
    const studentsWithStats = students.map((student) => {
      const totalSubmissions = student.submissions.length;
      const approvedSubmissions = student.submissions.filter(
        (s) => s.status === "APPROVED"
      ).length;
      const pendingSubmissions = student.submissions.filter(
        (s) => s.status === "PENDING" || s.status === "AI_CHECKED"
      ).length;
      const averageScore =
        totalSubmissions > 0
          ? student.submissions.reduce((sum, s) => sum + (s.score || 0), 0) /
            totalSubmissions
          : 0;

      return {
        id: student.id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        username: student.username,
        status: student.status,
        createdAt: student.createdAt,
        enrolledCourses: student.enrolledCourses,
        stats: {
          totalSubmissions,
          approvedSubmissions,
          pendingSubmissions,
          averageScore: Math.round(averageScore * 100) / 100,
        },
      };
    });

    return NextResponse.json({
      students: studentsWithStats,
      courses: teacherCourses,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
