import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const body = await request.json();
    const { materialIds } = body;

    if (!Array.isArray(materialIds) || materialIds.length === 0) {
      return NextResponse.json(
        { error: "Nieprawidłowa lista materiałów" },
        { status: 400 }
      );
    }

    // Get all materials with their course info
    const materials = await prisma.material.findMany({
      where: {
        id: {
          in: materialIds,
        },
      },
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

    // Verify all materials belong to teacher's courses
    const unauthorizedMaterial = materials.find(
      (material) =>
        material.subchapter.chapter.course.teacherId !== session.user.id
    );

    if (unauthorizedMaterial) {
      return NextResponse.json(
        { error: "Nie masz uprawnień do usunięcia niektórych materiałów" },
        { status: 403 }
      );
    }

    // Delete files from Cloudinary for PDFs
    const cloudinaryDeletions = materials
      .filter(
        (material) =>
          material.type === "PDF" && material.content.includes("cloudinary.com")
      )
      .map(async (material) => {
        try {
          // Extract public_id from Cloudinary URL
          // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
          const urlParts = material.content.split("/");
          const uploadIndex = urlParts.indexOf("upload");
          if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
            // Get everything after 'upload/' and before the last dot
            const pathAfterUpload = urlParts.slice(uploadIndex + 1).join("/");
            const publicId = pathAfterUpload.replace(/\.[^/.]+$/, ""); // Remove extension

            await cloudinary.uploader.destroy(publicId, {
              resource_type: "image", // PDFs are stored as images in Cloudinary
            });
          }
        } catch (error) {
          console.error(
            `Error deleting file from Cloudinary for material ${material.id}:`,
            error
          );
          // Continue with deletion even if Cloudinary cleanup fails
        }
      });

    await Promise.all(cloudinaryDeletions);

    // Delete materials from database
    await prisma.material.deleteMany({
      where: {
        id: {
          in: materialIds,
        },
      },
    });

    return NextResponse.json({
      message: `Usunięto ${materials.length} materiałów`,
      deletedCount: materials.length,
    });
  } catch (error) {
    console.error("Error bulk deleting materials:", error);
    return NextResponse.json(
      { error: "Błąd podczas usuwania materiałów" },
      { status: 500 }
    );
  }
}
