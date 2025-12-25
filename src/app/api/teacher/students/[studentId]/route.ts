import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = params;

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

    // Pobierz dane ucznia
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
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
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        status: true,
        createdAt: true,
        enrolledCourses: {
          where: {
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
                description: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student details:", error);
    return NextResponse.json(
      { error: "Failed to fetch student details" },
      { status: 500 }
    );
  }
}
