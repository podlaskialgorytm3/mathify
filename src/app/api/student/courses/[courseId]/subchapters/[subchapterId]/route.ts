import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ courseId: string; subchapterId: string }>;
  }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, subchapterId } = await params;

    // Sprawdź czy uczeń jest zapisany na kurs
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: courseId,
          studentId: session.user.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 404 }
      );
    }

    // Pobierz informacje o podrozdziale
    const subchapter = await prisma.subchapter.findUnique({
      where: {
        id: subchapterId,
      },
      select: {
        id: true,
        title: true,
        order: true,
        allowSubmissions: true,
        chapter: {
          select: {
            title: true,
            order: true,
            courseId: true,
          },
        },
        visibility: {
          where: {
            studentId: session.user.id,
          },
          select: {
            isVisible: true,
            canSubmit: true,
          },
        },
      },
    });

    if (!subchapter) {
      return NextResponse.json(
        { error: "Subchapter not found" },
        { status: 404 }
      );
    }

    // Sprawdź czy podrozdział należy do tego kursu
    if (subchapter.chapter.courseId !== courseId) {
      return NextResponse.json(
        { error: "Subchapter does not belong to this course" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: subchapter.id,
      title: subchapter.title,
      order: subchapter.order,
      chapterTitle: subchapter.chapter.title,
      chapterOrder: subchapter.chapter.order,
      allowSubmissions: subchapter.allowSubmissions,
      isVisible: subchapter.visibility[0]?.isVisible || false,
      canSubmit: subchapter.visibility[0]?.canSubmit || false,
    });
  } catch (error) {
    console.error("Error fetching subchapter:", error);
    return NextResponse.json(
      { error: "Failed to fetch subchapter" },
      { status: 500 }
    );
  }
}
