import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";
import { verifyCourseEditAccess } from "@/lib/course-access";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { materialId } = await params;

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        subchapters: {
          include: {
            subchapter: {
              include: { chapter: true }
            }
          }
        }
      }
    });

    if (!material) {
      return NextResponse.json(
        { error: "Materiał nie istnieje" },
        { status: 404 }
      );
    }

    // Verify teacher owns the material or has edit access to a course containing it
    let hasAccess = material.ownerId === session.user.id;
    
    if (!hasAccess) {
      for (const ms of material.subchapters) {
        if (await verifyCourseEditAccess(ms.subchapter.chapter.courseId, session.user.id)) {
          hasAccess = true;
          break;
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Nie masz uprawnień do usunięcia tego materiału" },
        { status: 403 }
      );
    }

    // Delete file from Cloudinary if it's a PDF hosted there
    if (
      material.type === "PDF" &&
      material.content.includes("cloudinary.com")
    ) {
      try {
        const urlParts = material.content.split("/");
        const uploadIndex = urlParts.indexOf("upload");
        if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
          const pathAfterUpload = urlParts.slice(uploadIndex + 1).join("/");
          const publicId = pathAfterUpload.replace(/\.[^/.]+$/, "");
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
          });
        }
      } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        // Continue with deletion even if Cloudinary cleanup fails
      }
    }

    // Delete material — MaterialSubchapter rows are cascade deleted automatically
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
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { materialId } = await params;
    const body = await request.json();

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        subchapters: {
          include: {
            subchapter: {
              include: { chapter: true }
            }
          }
        }
      }
    });

    if (!material) {
      return NextResponse.json(
        { error: "Materiał nie istnieje" },
        { status: 404 }
      );
    }

    // Verify teacher owns the material or has edit access to a course containing it
    let hasAccess = material.ownerId === session.user.id;
    
    if (!hasAccess) {
      for (const ms of material.subchapters) {
        if (await verifyCourseEditAccess(ms.subchapter.chapter.courseId, session.user.id)) {
          hasAccess = true;
          break;
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Nie masz uprawnień do edycji tego materiału" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined)
      updateData.description = body.description;

    // If order is provided, update it in MaterialSubchapter for the specific subchapter
    if (body.order !== undefined && body.subchapterId) {
      await prisma.materialSubchapter.updateMany({
        where: { materialId, subchapterId: body.subchapterId },
        data: { order: body.order },
      });
    }

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
