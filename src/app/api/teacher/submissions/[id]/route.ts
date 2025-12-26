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
        review: {
          include: {
            teacher: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
        tasks: true,
        aiResult: true,
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
    const { status, approved, generalComment, tasks } = body;

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

    // Aktualizuj status submission
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        status: status || submission.status,
      },
    });

    // Utwórz lub zaktualizuj review
    if (approved !== undefined || generalComment) {
      // Sprawdź czy review już istnieje
      const existingReview = await prisma.submissionReview.findUnique({
        where: { submissionId: id },
      });

      if (existingReview) {
        // Aktualizuj istniejący review
        await prisma.submissionReview.update({
          where: { submissionId: id },
          data: {
            approved:
              approved !== undefined ? approved : existingReview.approved,
            generalComment:
              generalComment !== undefined
                ? generalComment
                : existingReview.generalComment,
            reviewedAt: new Date(),
          },
        });
      } else {
        // Utwórz nowy review
        await prisma.submissionReview.create({
          data: {
            submissionId: id,
            teacherId: session.user.id,
            approved: approved || false,
            generalComment: generalComment || null,
          },
        });
      }
    }

    // Zarządzanie zadaniami (tasks)
    if (tasks && Array.isArray(tasks)) {
      // Usuń wszystkie istniejące zadania
      await prisma.task.deleteMany({
        where: { submissionId: id },
      });

      // Utwórz nowe zadania
      if (tasks.length > 0) {
        await prisma.task.createMany({
          data: tasks.map((task: any) => ({
            submissionId: id,
            taskNumber: task.taskNumber,
            pointsEarned: task.pointsEarned,
            maxPoints: task.maxPoints,
            comment: task.comment || null,
            teacherComment: task.teacherComment || null,
            teacherEdited: true,
          })),
        });
      }
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
