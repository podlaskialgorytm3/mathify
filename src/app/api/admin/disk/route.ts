import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/disk
// Lista wszystkich materiałów (admin) — opcjonalnie filtrowana po teacherId
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");
    const source = searchParams.get("source");
    const sort = searchParams.get("sort") || "desc";

    const where: Record<string, unknown> = {};
    if (teacherId) where.ownerId = teacherId;
    if (source === "COURSE" || source === "HOMEWORK") where.source = source;

    const materials = await prisma.material.findMany({
      where,
      orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        subchapters: {
          include: {
            subchapter: {
              include: {
                chapter: {
                  include: {
                    course: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = materials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.type,
      content: m.content,
      source: m.source,
      createdAt: m.createdAt,
      owner: m.owner,
      usedInCount: m.subchapters.length,
      usedIn: m.subchapters.map((ms) => ({
        subchapterId: ms.subchapterId,
        subchapterTitle: ms.subchapter.title,
        courseTitle: ms.subchapter.chapter.course.title,
      })),
    }));

    return NextResponse.json({ materials: result });
  } catch (error) {
    console.error("Error fetching admin disk:", error);
    return NextResponse.json(
      { error: "Błąd pobierania dysku" },
      { status: 500 }
    );
  }
}
