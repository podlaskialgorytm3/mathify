import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pobierz wszystkie prace ucznia
    const submissions = await prisma.submission.findMany({
      where: {
        studentId: session.user.id,
      },
      include: {
        subchapter: {
          select: {
            title: true,
            chapter: {
              select: {
                title: true,
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
        tasks: {
          select: {
            taskNumber: true,
            pointsEarned: true,
            maxPoints: true,
            comment: true,
            teacherComment: true,
            teacherEdited: true,
          },
          orderBy: {
            taskNumber: "asc",
          },
        },
        review: {
          select: {
            approved: true,
            generalComment: true,
            reviewedAt: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    // Pobierz unikalne kursy
    const courseIds = [
      ...new Set(submissions.map((s) => s.subchapter.chapter.course.id)),
    ];

    const courses = await prisma.course.findMany({
      where: {
        id: {
          in: courseIds,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    return NextResponse.json({
      submissions,
      courses,
    });
  } catch (error) {
    console.error("Error fetching student submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const subchapterId = formData.get("subchapterId") as string;

    if (!file || !subchapterId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Sprawdź czy uczeń ma dostęp do tego podrozdziału
    const subchapter = await prisma.subchapter.findUnique({
      where: {
        id: subchapterId,
      },
      select: {
        id: true,
        allowSubmissions: true,
        chapter: {
          select: {
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

    // Sprawdź czy uczeń jest zapisany na kurs
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: subchapter.chapter.courseId,
          studentId: session.user.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Sprawdź czy podrozdział jest widoczny i czy można przesyłać prace
    if (!subchapter.visibility[0]?.isVisible) {
      return NextResponse.json(
        { error: "Subchapter is not visible" },
        { status: 403 }
      );
    }

    if (!subchapter.allowSubmissions) {
      return NextResponse.json(
        { error: "Submissions are not allowed for this subchapter" },
        { status: 403 }
      );
    }

    if (!subchapter.visibility[0]?.canSubmit) {
      return NextResponse.json(
        { error: "Submission is currently disabled by the teacher" },
        { status: 403 }
      );
    }

    // Zapisz plik
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Utwórz unikalną nazwę pliku
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const safeFileName = file.name
      .replace(fileExtension, "")
      .replace(/[^a-zA-Z0-9]/g, "_");
    const uniqueFileName = `${timestamp}_${safeFileName}${fileExtension}`;

    // Ścieżka do zapisu
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "submissions"
    );
    const filePath = path.join(uploadDir, uniqueFileName);

    // Utwórz folder jeśli nie istnieje
    await mkdir(uploadDir, { recursive: true });

    // Zapisz plik
    await writeFile(filePath, buffer);

    // Utwórz rekord w bazie danych
    const submission = await prisma.submission.create({
      data: {
        subchapterId: subchapterId,
        studentId: session.user.id,
        filePath: `/uploads/submissions/${uniqueFileName}`,
        fileName: file.name,
        fileSize: file.size,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      message: "Submission uploaded successfully",
      submission: {
        id: submission.id,
        fileName: submission.fileName,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    console.error("Error uploading submission:", error);
    return NextResponse.json(
      { error: "Failed to upload submission" },
      { status: 500 }
    );
  }
}
