import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { materialId } = params;

    // Get material with subchapter and course info
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        subchapter: {
          include: {
            chapter: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Materiał nie istnieje" },
        { status: 404 }
      );
    }

    // Verify teacher owns the course
    if (material.subchapter.chapter.course.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "Nie masz uprawnień do usunięcia tego materiału" },
        { status: 403 }
      );
    }

    // Delete file if it's a PDF
    if (material.type === "PDF" && material.content.startsWith("/uploads/")) {
      const filepath = join(process.cwd(), "public", material.content);
      if (existsSync(filepath)) {
        await unlink(filepath);
      }
    }

    // Delete material from database
    await prisma.material.delete({
      where: { id: materialId },
    });

    return NextResponse.json({
      message: "Materiał został usunięty",
    });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: "Błąd usuwania materiału" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { materialId: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { materialId } = params;
    const body = await request.json();

    // Get material with subchapter and course info
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        subchapter: {
          include: {
            chapter: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Materiał nie istnieje" },
        { status: 404 }
      );
    }

    // Verify teacher owns the course
    if (material.subchapter.chapter.course.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "Nie masz uprawnień do edycji tego materiału" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.order !== undefined) updateData.order = body.order;

    const updatedMaterial = await prisma.material.update({
      where: { id: materialId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Materiał zaktualizowany",
      material: updatedMaterial,
    });
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji materiału" },
      { status: 500 }
    );
  }
}
