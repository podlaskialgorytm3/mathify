import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await params;

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await params;
    const body = await request.json();
    const { firstName, lastName, status } = body;

    if (!firstName || !lastName || !status) {
      return NextResponse.json(
        { error: "Imię, nazwisko i status są wymagane" },
        { status: 400 }
      );
    }

    // Sprawdź czy to uczeń tego nauczyciela
    const teacherCourses = await prisma.course.findMany({
      where: { teacherId: session.user.id },
      select: { id: true },
    });
    
    const courseIds = teacherCourses.map((c) => c.id);
    
    const studentExists = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: "STUDENT",
        enrolledCourses: {
          some: { courseId: { in: courseIds } },
        },
      },
    });
    
    if (!studentExists) {
      return NextResponse.json({ error: "Student not found or unauthorized" }, { status: 404 });
    }

    // Aktualizuj dane
    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: {
        firstName,
        lastName,
        status,
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji ucznia" },
      { status: 500 }
    );
  }
}
