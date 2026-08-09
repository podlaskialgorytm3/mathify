import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Check how many students created by this teacher are enrolled in this course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const enrollmentsCount = await prisma.courseEnrollment.count({
      where: {
        courseId: id,
        student: {
          createdById: session.user.id,
        },
      },
    });

    return NextResponse.json({
      count: enrollmentsCount,
    });
  } catch (error) {
    console.error("Error checking unlinked students count:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas sprawdzania uczniów" },
      { status: 500 }
    );
  }
}

// DELETE: Perform the unlink logic
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacherAccesses: {
          where: { teacherId: session.user.id },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Kurs nie istnieje" },
        { status: 404 }
      );
    }

    if (course.teacherId === session.user.id) {
      return NextResponse.json(
        { error: "Nie możesz odpiąć własnego kursu" },
        { status: 400 }
      );
    }

    // Start a transaction to remove teacherAccess addedToAccount and remove student enrollments
    await prisma.$transaction(async (tx) => {
      // 1. Remove course enrollments for students created by this teacher
      const studentsToRemove = await tx.user.findMany({
        where: {
          createdById: session.user.id,
          role: "STUDENT",
        },
        select: { id: true },
      });

      const studentIds = studentsToRemove.map((s) => s.id);

      if (studentIds.length > 0) {
        await tx.courseEnrollment.deleteMany({
          where: {
            courseId: id,
            studentId: { in: studentIds },
          },
        });
      }

      // 2. Set addedToAccount to false if there's an access record
      if (course.teacherAccesses.length > 0) {
        await tx.courseTeacherAccess.update({
          where: { id: course.teacherAccesses[0].id },
          data: { addedToAccount: false },
        });
      }
    });

    return NextResponse.json({
      message: "Kurs został pomyślnie odpięty od Twojego konta",
    });
  } catch (error) {
    console.error("Error unlinking course:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas odpinania kursu" },
      { status: 500 }
    );
  }
}
