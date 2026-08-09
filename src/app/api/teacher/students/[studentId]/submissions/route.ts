import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import { checkSubmissionWithAI } from "@/lib/gemini";
import { convertImagesToPDF, mergePDFs } from "@/lib/pdf-utils";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await params;

    const formData = await request.formData();
    const uploadMode = formData.get("uploadMode") as string;
    const subchapterId = formData.get("subchapterId") as string;

    if (!subchapterId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Sprawdź czy podrozdział istnieje i należy do kursu nauczyciela
    const subchapter = await prisma.subchapter.findUnique({
      where: { id: subchapterId },
      select: {
        id: true,
        allowSubmissions: true,
        chapter: {
          select: {
            courseId: true,
            course: {
              select: {
                id: true,
                teacherId: true,
              },
            },
          },
        },
      },
    });

    if (!subchapter) {
      return NextResponse.json(
        { error: "Subchapter not found" },
        { status: 404 },
      );
    }

    // Sprawdź czy nauczyciel jest właścicielem kursu
    if (subchapter.chapter.course.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized for this course" },
        { status: 403 },
      );
    }

    // Sprawdź czy uczeń jest zapisany na kurs
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: subchapter.chapter.courseId,
          studentId: studentId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Student is not enrolled in this course" },
        { status: 403 },
      );
    }

    if (!subchapter.allowSubmissions) {
      return NextResponse.json(
        { error: "Submissions are not allowed for this subchapter" },
        { status: 403 },
      );
    }

    let finalPdfBuffer: Buffer;
    let fileName = "homework.pdf";

    if (uploadMode === "pdf") {
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 },
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
          { status: 400 },
        );
      }

      if (images.length > 10) {
        return NextResponse.json(
          { error: "Maximum 10 images allowed" },
          { status: 400 },
        );
      }

      const imageBuffers: Buffer[] = [];
      for (const image of images) {
        const bytes = await image.arrayBuffer();
        imageBuffers.push(Buffer.from(bytes));
      }

      const imagesPdf = await convertImagesToPDF(imageBuffers);

      // Pobierz materiały PDF dla tego podrozdziału
      const pdfEntries = await prisma.materialSubchapter.findMany({
        where: {
          subchapterId: subchapterId,
          material: { type: "PDF" },
        },
        orderBy: { order: "asc" },
        include: { material: true },
      });
      const allPdfMaterials = pdfEntries.map((e) => e.material);

      const systemSettings = await prisma.systemSettings.findFirst();
      const homeworkFileName =
        systemSettings?.defaultHomeworkFileName || "Praca Domowa.pdf";

      const homeworkMaterial = allPdfMaterials.find((mat) =>
        mat.title.toLowerCase().includes("praca domowa"),
      );

      if (homeworkMaterial && homeworkMaterial.content) {
        try {
          let homeworkPdfBuffer: Buffer;

          if (
            homeworkMaterial.content.startsWith("http://") ||
            homeworkMaterial.content.startsWith("https://")
          ) {
            const response = await fetch(homeworkMaterial.content);
            if (!response.ok) {
              throw new Error(
                `Failed to download homework PDF: ${response.statusText}`,
              );
            }
            const arrayBuffer = await response.arrayBuffer();
            homeworkPdfBuffer = Buffer.from(arrayBuffer);
          } else {
            const homeworkPdfPath = path.join(
              process.cwd(),
              "public",
              homeworkMaterial.content,
            );
            homeworkPdfBuffer = await readFile(homeworkPdfPath);
          }

          finalPdfBuffer = await mergePDFs(imagesPdf, homeworkPdfBuffer);
          fileName = `${homeworkFileName}_with_images.pdf`;
        } catch (error) {
          console.error("Error reading homework PDF:", error);
          finalPdfBuffer = imagesPdf;
          fileName = "images_submission.pdf";
        }
      } else {
        finalPdfBuffer = imagesPdf;
        fileName = "images_submission.pdf";
      }
    } else {
      return NextResponse.json(
        { error: "Invalid upload mode" },
        { status: 400 },
      );
    }

    // Upload do Cloudinary
    const timestamp = Date.now();
    const safeFileName = fileName
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9]/g, "_");
    const uniqueFileName = `${timestamp}_${safeFileName}.pdf`;

    const cloudinaryResult = await uploadBufferToCloudinary(
      finalPdfBuffer,
      uniqueFileName,
      "application/pdf",
      "mathify/submissions",
    );

    // Utwórz rekord submission w imieniu ucznia
    const submission = await prisma.submission.create({
      data: {
        subchapterId: subchapterId,
        studentId: studentId,
        filePath: cloudinaryResult.url,
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

    if (aiPromptTemplate?.prompt) {
      try {
        const aiResult = await checkSubmissionWithAI(
          cloudinaryResult.url,
          submission.id,
          aiPromptTemplate.prompt,
        );

        const tasksData = aiResult.tasks.map((task) => ({
          submissionId: submission.id,
          taskNumber: task.taskNumber,
          pointsEarned: task.pointsEarned,
          maxPoints: task.maxPoints,
          comment: task.comment,
          teacherEdited: false,
        }));

        await prisma.$transaction([
          prisma.task.createMany({
            data: tasksData,
          }),
          prisma.aIResult.create({
            data: {
              submissionId: submission.id,
              rawResponse: aiResult.rawResponse,
            },
          }),
          prisma.submission.update({
            where: { id: submission.id },
            data: { status: "AI_CHECKED" },
          }),
        ]);
      } catch (aiError) {
        console.error("AI checking failed for teacher submission:", aiError);
      }
    }

    return NextResponse.json({
      message: "Submission uploaded successfully on behalf of student",
      submission: {
        id: submission.id,
        fileName: submission.fileName,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
      aiProcessing: !!aiPromptTemplate?.prompt,
    });
  } catch (error) {
    console.error("Error uploading submission on behalf of student:", error);
    return NextResponse.json(
      { error: "Failed to upload submission" },
      { status: 500 },
    );
  }
}
