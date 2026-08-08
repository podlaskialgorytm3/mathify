import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Brak ID kursu" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
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

    // Check if it's a public course without explicit access record
    if (course.visibility === "PUBLIC" && course.teacherAccesses.length === 0) {
      await prisma.courseTeacherAccess.create({
        data: {
          courseId,
          teacherId: session.user.id,
          accessType: course.publicAccessType || "READ_ONLY",
          addedToAccount: true,
        },
      });
    } else if (course.teacherAccesses.length > 0) {
      await prisma.courseTeacherAccess.update({
        where: { id: course.teacherAccesses[0].id },
        data: { addedToAccount: true },
      });
    } else {
      return NextResponse.json(
        { error: "Brak dostępu do tego kursu" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: "Kurs został przypisany do Twojego konta",
    });
  } catch (error) {
    console.error("Error linking course:", error);
    return NextResponse.json(
      { error: "Błąd podczas przypisywania kursu" },
      { status: 500 }
    );
  }
}
