import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyCourseEditAccess } from "@/lib/course-access";

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

    // Verify subchapter exists and teacher has edit access
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

    if (!subchapter) {
      return NextResponse.json(
        { error: "Podrozdział nie istnieje" },
        { status: 404 }
      );
    }

    const hasAccess = await verifyCourseEditAccess(subchapter.chapter.courseId, session.user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Brak uprawnień do edycji tego kursu" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, type, content, source, hashCode, existingMaterialId } = body;

    if (existingMaterialId) {
      const existingLink = await prisma.materialSubchapter.findFirst({
        where: {
          materialId: existingMaterialId,
          subchapterId: subchapterId,
        }
      });

      if (existingLink) {
        return NextResponse.json(
          { error: "Nie można dodawać drugi raz tego samego materiału do jednego podrozdziału." },
          { status: 400 }
        );
      }
    } else if (hashCode) {
      const existingLink = await prisma.materialSubchapter.findFirst({
        where: {
          subchapterId: subchapterId,
          material: {
            hashCode: hashCode,
          }
        }
      });

      if (existingLink) {
        return NextResponse.json(
          { error: "Nie można dodawać drugi raz tego samego materiału do jednego podrozdziału." },
          { status: 400 }
        );
      }
    }

    if (!existingMaterialId && (!title || !type || !content)) {
      return NextResponse.json(
        { error: "Tytuł, typ i zawartość są wymagane" },
        { status: 400 }
      );
    }

    if (!existingMaterialId && !["PDF", "LINK"].includes(type)) {
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
      let finalMaterial;

      if (existingMaterialId) {
        // Just link to existing material
        finalMaterial = await tx.material.findUnique({
          where: { id: existingMaterialId },
        });

        if (!finalMaterial) {
          throw new Error("Wybrany materiał nie istnieje");
        }
      } else {
        // Create new material
        finalMaterial = await tx.material.create({
          data: {
            title,
            description: description || null,
            type,
            content,
            source: materialSource,
            ownerId: subchapter.chapter.course.teacherId, // Assign owner to course's original teacher
            hashCode: hashCode || null,
          },
        });
      }

      await tx.materialSubchapter.create({
        data: {
          materialId: finalMaterial.id,
          subchapterId,
          order,
        },
      });

      return finalMaterial;
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
