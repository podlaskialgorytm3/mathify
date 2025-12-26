import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pobierz kursy ucznia z widocznymi rozdziałami
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId: session.user.id,
      },
      select: {
        enrolledAt: true,
        course: {
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
              where: {
                visibility: {
                  some: {
                    studentId: session.user.id,
                    isVisible: true,
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
              select: {
                id: true,
                title: true,
                order: true,
                _count: {
                  select: {
                    subchapters: true,
                  },
                },
              },
            },
            _count: {
              select: {
                chapters: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    // Przekształć dane do odpowiedniego formatu
    const courses = enrollments.map((enrollment) => ({
      id: enrollment.course.id,
      title: enrollment.course.title,
      description: enrollment.course.description,
      enrolledAt: enrollment.enrolledAt,
      teacher: enrollment.course.teacher,
      chapters: enrollment.course.chapters,
      _count: enrollment.course._count,
    }));

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching student courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
