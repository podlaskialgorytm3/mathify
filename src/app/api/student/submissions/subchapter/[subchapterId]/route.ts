import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subchapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subchapterId } = await params;

    // Pobierz submission dla tego podrozdziału i ucznia
    const submission = await prisma.submission.findFirst({
      where: {
        subchapterId: subchapterId,
        studentId: session.user.id,
      },
      orderBy: {
        submittedAt: "desc",
      },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        status: true,
        submittedAt: true,
      },
    });

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subchapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subchapterId } = await params;

    // Znajdź submission
    const submission = await prisma.submission.findFirst({
      where: {
        subchapterId: subchapterId,
        studentId: session.user.id,
      },
      select: {
        id: true,
        filePath: true,
        status: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Nie pozwalaj usunąć pracy, która została już sprawdzona
    if (
      submission.status === "APPROVED" ||
      submission.status === "TEACHER_REVIEWING"
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete submission that is being reviewed or has been approved",
        },
        { status: 403 }
      );
    }

    // Usuń plik z dysku
    try {
      const filePath = path.join(process.cwd(), "public", submission.filePath);
      await unlink(filePath);
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
      // Kontynuuj mimo błędu - plik może już nie istnieć
    }

    // Usuń rekord z bazy danych
    await prisma.submission.delete({
      where: {
        id: submission.id,
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
