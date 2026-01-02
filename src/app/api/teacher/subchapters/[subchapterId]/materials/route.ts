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
    const { title, description, type, content } = body;

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

    // Get next order
    const lastMaterial = await prisma.material.findFirst({
      where: { subchapterId },
      orderBy: { order: "desc" },
    });
    const order = lastMaterial ? lastMaterial.order + 1 : 1;

    const material = await prisma.material.create({
      data: {
        title,
        description: description || null,
        type,
        content,
        order,
        subchapterId,
      },
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

    const materials = await prisma.material.findMany({
      where: { subchapterId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Błąd pobierania materiałów" },
      { status: 500 }
    );
  }
}
