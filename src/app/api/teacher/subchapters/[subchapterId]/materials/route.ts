import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subchapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { subchapterId } = await params;

    // Verify subchapter belongs to teacher's course
    const subchapter = await prisma.subchapter.findUnique({
      where: { id: subchapterId },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
      },
    });

    if (
      !subchapter ||
      subchapter.chapter.course.teacherId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Podrozdział nie istnieje lub nie masz do niego dostępu" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, type, content, source } = body;

    if (!title || !type || !content) {
      return NextResponse.json(
        { error: "Tytuł, typ i zawartość są wymagane" },
        { status: 400 }
      );
    }

    if (!["PDF", "LINK"].includes(type)) {
      return NextResponse.json(
        { error: "Nieprawidłowy typ materiału" },
        { status: 400 }
      );
    }

    const materialSource =
      source === "HOMEWORK" ? "HOMEWORK" : "COURSE";

    // Get next order for this subchapter
    const lastEntry = await prisma.materialSubchapter.findFirst({
      where: { subchapterId },
      orderBy: { order: "desc" },
    });
    const order = lastEntry ? lastEntry.order + 1 : 1;

    // Create Material + MaterialSubchapter in a transaction
    const material = await prisma.$transaction(async (tx) => {
      const newMaterial = await tx.material.create({
        data: {
          title,
          description: description || null,
          type,
          content,
          source: materialSource,
          ownerId: session.user.id,
        },
      });

      await tx.materialSubchapter.create({
        data: {
          materialId: newMaterial.id,
          subchapterId,
          order,
        },
      });

      return newMaterial;
    });

    return NextResponse.json({
      message: "Materiał został dodany",
      material,
    });
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      { error: "Błąd podczas dodawania materiału" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subchapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !["TEACHER", "STUDENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { subchapterId } = await params;

    const entries = await prisma.materialSubchapter.findMany({
      where: { subchapterId },
      orderBy: { order: "asc" },
      include: {
        material: true,
      },
    });

    const materials = entries.map((e) => ({
      ...e.material,
      order: e.order,
      addedAt: e.addedAt,
    }));

    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Błąd pobierania materiałów" },
      { status: 500 }
    );
  }
}
