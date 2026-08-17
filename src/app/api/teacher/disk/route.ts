import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/teacher/disk
// Lista materiałów zalogowanego nauczyciela (unikalnych po materialId)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source"); // COURSE | HOMEWORK | null (wszystkie)
    const sort = searchParams.get("sort") || "desc"; // asc | desc

    const where: any = {
      OR: [
        { ownerId: session.user.id },
        {
          subchapters: {
            some: {
              subchapter: {
                chapter: {
                  course: {
                    OR: [
                      { teacherId: session.user.id },
                      { teacherAccesses: { some: { teacherId: session.user.id } } },
                    ],
                  },
                },
              },
            },
          },
        },
      ],
    };

    if (source === "COURSE" || source === "HOMEWORK") {
      where.source = source;
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
      include: {
        subchapters: {
          include: {
            subchapter: {
              include: {
                chapter: {
                  include: {
                    course: {
                      select: { id: true, title: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Flatten: dodaj info o liczbie podrozdziałów i kursach
    const result = materials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.type,
      content: m.content,
      source: m.source,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      usedInCount: m.subchapters.length,
      usedIn: m.subchapters.map((ms) => ({
        subchapterId: ms.subchapterId,
        subchapterTitle: ms.subchapter.title,
        chapterId: ms.subchapter.chapterId,
        chapterTitle: ms.subchapter.chapter.title,
        courseId: ms.subchapter.chapter.courseId,
        courseTitle: ms.subchapter.chapter.course.title,
        order: ms.order,
      })),
    }));

    return NextResponse.json({ materials: result });
  } catch (error) {
    console.error("Error fetching disk:", error);
    return NextResponse.json(
      { error: "Błąd pobierania dysku" },
      { status: 500 }
    );
  }
}
