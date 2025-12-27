import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all students created by this teacher
    const students = await prisma.user.findMany({
      where: {
        createdById: session.user.id,
        role: "STUDENT",
      },
      include: {
        enrolledCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response
    const formattedStudents = students.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      username: student.username,
      status: student.status,
      createdAt: student.createdAt,
      courses: student.enrolledCourses.map((enrollment) => ({
        id: enrollment.course.id,
        title: enrollment.course.title,
        enrolledAt: enrollment.enrolledAt,
      })),
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error: any) {
    console.error("Error fetching created students:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania uczniów" },
      { status: 500 }
    );
  }
}
