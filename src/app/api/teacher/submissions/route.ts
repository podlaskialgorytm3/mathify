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
    const status = searchParams.get("status");
    const courseId = searchParams.get("courseId");
    const studentId = searchParams.get("studentId");

    // Pobierz kursy nauczyciela
    const teacherCourses = await prisma.course.findMany({
      where: {
        teacherId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    const courseIds = teacherCourses.map((c) => c.id);

    if (courseIds.length === 0) {
      return NextResponse.json({
        submissions: [],
        courses: [],
        stats: {
          total: 0,
          pending: 0,
          aiChecked: 0,
          reviewing: 0,
          approved: 0,
          rejected: 0,
        },
      });
    }

    // Buduj zapytanie
    const whereClause: any = {
      subchapter: {
        chapter: {
          courseId: {
            in: courseIds,
          },
        },
      },
    };

    if (status) {
      whereClause.status = status;
    }

    if (courseId) {
      whereClause.subchapter.chapter.courseId = courseId;
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subchapter: {
          select: {
            id: true,
            title: true,
            order: true,
            chapter: {
              select: {
                id: true,
                title: true,
                order: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        reviews: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            feedback: true,
            score: true,
            createdAt: true,
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Pobierz statystyki
    const allSubmissions = await prisma.submission.findMany({
      where: {
        subchapter: {
          chapter: {
            courseId: {
              in: courseIds,
            },
          },
        },
      },
      select: {
        status: true,
      },
    });

    const stats = {
      total: allSubmissions.length,
      pending: allSubmissions.filter((s) => s.status === "PENDING").length,
      aiChecked: allSubmissions.filter((s) => s.status === "AI_CHECKED").length,
      reviewing: allSubmissions.filter((s) => s.status === "TEACHER_REVIEWING")
        .length,
      approved: allSubmissions.filter((s) => s.status === "APPROVED").length,
      rejected: allSubmissions.filter((s) => s.status === "REJECTED").length,
    };

    // Pobierz kursy z liczbą prac
    const courses = await prisma.course.findMany({
      where: {
        id: {
          in: courseIds,
        },
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json({
      submissions,
      courses,
      stats,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
