import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
          },
        },
        subchapter: {
          select: {
            id: true,
            title: true,
            description: true,
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
                    teacherId: true,
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
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Sprawdź czy nauczyciel jest właścicielem kursu
    if (submission.subchapter.chapter.course.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, score, feedback } = body;

    // Sprawdź czy submission istnieje i czy nauczyciel ma do niego dostęp
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        subchapter: {
          select: {
            chapter: {
              select: {
                course: {
                  select: {
                    teacherId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.subchapter.chapter.course.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Aktualizuj submission
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status: status || submission.status,
        score: score !== undefined ? score : submission.score,
      },
    });

    // Dodaj review jeśli podano feedback
    if (feedback) {
      await prisma.submissionReview.create({
        data: {
          submissionId: id,
          reviewerId: session.user.id,
          feedback,
          score: score !== undefined ? score : null,
        },
      });
    }

    return NextResponse.json({
      message: "Praca została zaktualizowana",
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
