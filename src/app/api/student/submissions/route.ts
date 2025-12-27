import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink, readFile } from "fs/promises";
import path from "path";
import { checkSubmissionWithAI } from "@/lib/gemini";
import { convertImagesToPDF, mergePDFs } from "@/lib/pdf-utils";

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
    const uploadMode = formData.get("uploadMode") as string;
    const subchapterId = formData.get("subchapterId") as string;

    if (!subchapterId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let finalPdfBuffer: Buffer;
    let fileName = "homework.pdf";

    if (uploadMode === "pdf") {
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      fileName = file.name;
      const bytes = await file.arrayBuffer();
      finalPdfBuffer = Buffer.from(bytes);
    } else if (uploadMode === "images") {
      const images = formData.getAll("images") as File[];

      if (!images || images.length === 0) {
        return NextResponse.json(
          { error: "No images provided" },
          { status: 400 }
        );
      }

      if (images.length > 10) {
        return NextResponse.json(
          { error: "Maximum 10 images allowed" },
          { status: 400 }
        );
      }

      // Konwertuj zdjęcia do bufferów
      const imageBuffers: Buffer[] = [];
      for (const image of images) {
        const bytes = await image.arrayBuffer();
        imageBuffers.push(Buffer.from(bytes));
      }

      // Konwertuj zdjęcia do PDF
      const imagesPdf = await convertImagesToPDF(imageBuffers);

      // Pobierz nazwę pliku pracy domowej z kursu
      const subchapterWithCourse = await prisma.subchapter.findUnique({
        where: { id: subchapterId },
        include: {
          chapter: {
            include: {
              course: {
                select: {
                  homeworkFileName: true,
                },
              },
            },
          },
        },
      });

      const homeworkFileName =
        subchapterWithCourse?.chapter.course.homeworkFileName || "Praca Domowa";

      // Sprawdź czy istnieje plik z pracą domową w materiałach podrozdziału
      const homeworkMaterial = await prisma.material.findFirst({
        where: {
          subchapterId: subchapterId,
          type: "PDF",
          OR: [
            { title: { contains: homeworkFileName, mode: "insensitive" } },
            { content: { contains: ".pdf", mode: "insensitive" } },
          ],
        },
        orderBy: {
          order: "asc",
        },
      });

      if (homeworkMaterial && homeworkMaterial.content) {
        // Odczytaj plik pracy domowej
        try {
          const homeworkPdfPath = path.join(
            process.cwd(),
            "public",
            homeworkMaterial.content
          );
          const homeworkPdfBuffer = await readFile(homeworkPdfPath);

          // Połącz PDF ze zdjęć z pracą domową
          finalPdfBuffer = await mergePDFs(imagesPdf, homeworkPdfBuffer);
          fileName = `${homeworkFileName}_with_images.pdf`;
        } catch (error) {
          console.error("Error reading homework PDF:", error);
          // Jeśli nie można odczytać pracy domowej, użyj tylko zdjęć
          finalPdfBuffer = imagesPdf;
          fileName = "images_submission.pdf";
        }
      } else {
        // Jeśli nie ma pliku pracy domowej, użyj tylko zdjęć
        finalPdfBuffer = imagesPdf;
        fileName = "images_submission.pdf";
      }
    } else {
      return NextResponse.json(
        { error: "Invalid upload mode" },
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
    // Utwórz unikalną nazwę pliku
    const timestamp = Date.now();
    const fileExtension = ".pdf"; // Zawsze PDF
    const safeFileName = fileName
      .replace(/\.pdf$/i, "")
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
    await writeFile(filePath, finalPdfBuffer);

    // Utwórz rekord w bazie danych
    const submission = await prisma.submission.create({
      data: {
        subchapterId: subchapterId,
        studentId: session.user.id,
        filePath: `/uploads/submissions/${uniqueFileName}`,
        fileName: fileName,
        fileSize: finalPdfBuffer.length,
        status: "PENDING",
      },
    });

    // Sprawdź czy kurs ma przypisany szablon AI
    const subchapterWithCourse = await prisma.subchapter.findUnique({
      where: { id: subchapterId },
      include: {
        chapter: {
          include: {
            course: {
              include: {
                aiPromptTemplate: true,
              },
            },
          },
        },
      },
    });

    const aiPromptTemplate =
      subchapterWithCourse?.chapter.course.aiPromptTemplate;

    // Jeśli istnieje szablon AI, uruchom automatyczne sprawdzanie w tle (asynchronicznie)
    if (aiPromptTemplate?.prompt) {
      // Nie czekamy na zakończenie - AI działa w tle
      checkSubmissionWithAI(
        submission.filePath,
        submission.id,
        aiPromptTemplate.prompt
      )
        .then(async (aiResult) => {
          try {
            // Utwórz zadania na podstawie odpowiedzi AI
            const tasksData = aiResult.tasks.map((task) => ({
              submissionId: submission.id,
              taskNumber: task.taskNumber,
              pointsEarned: task.pointsEarned,
              maxPoints: task.maxPoints,
              comment: task.comment,
              teacherEdited: false,
            }));

            // Zapisz wszystko w transakcji
            await prisma.$transaction([
              // Utwórz zadania
              prisma.task.createMany({
                data: tasksData,
              }),
              // Zapisz surową odpowiedź AI
              prisma.aIResult.create({
                data: {
                  submissionId: submission.id,
                  rawResponse: aiResult.rawResponse,
                },
              }),
              // Zaktualizuj status na AI_CHECKED
              prisma.submission.update({
                where: { id: submission.id },
                data: { status: "AI_CHECKED" },
              }),
            ]);

            console.log(
              `AI checking completed successfully for submission ${submission.id}`
            );
          } catch (saveError) {
            console.error(
              `Failed to save AI results for submission ${submission.id}:`,
              saveError
            );
          }
        })
        .catch((aiError) => {
          console.error(
            `AI checking failed for submission ${submission.id}:`,
            aiError
          );
        });
    }

    // Zwróć odpowiedź natychmiast (nie czekamy na AI)
    return NextResponse.json({
      message: "Submission uploaded successfully",
      submission: {
        id: submission.id,
        fileName: submission.fileName,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
      aiProcessing: !!aiPromptTemplate?.prompt, // Informacja czy AI działa w tle
    });
  } catch (error) {
    console.error("Error uploading submission:", error);
    return NextResponse.json(
      { error: "Failed to upload submission" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("id");

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    // Znajdź submission i sprawdź czy należy do ucznia
    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.studentId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own submissions" },
        { status: 403 }
      );
    }

    // Usuń plik z dysku
    try {
      const filePath = path.join(process.cwd(), "public", submission.filePath);
      await unlink(filePath);
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
      // Kontynuuj nawet jeśli plik nie istnieje
    }

    // Usuń rekord z bazy (cascade usunie Tasks i AIResult)
    await prisma.submission.delete({
      where: {
        id: submissionId,
      },
    });

    return NextResponse.json({
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}
