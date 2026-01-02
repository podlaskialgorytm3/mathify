import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as "PDF" | "LINK";
    const file = formData.get("file") as File | null;
    const link = formData.get("link") as string | null;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Tytuł i typ są wymagane" },
        { status: 400 }
      );
    }

    let content = "";

    if (type === "LINK") {
      if (!link) {
        return NextResponse.json(
          { error: "Link jest wymagany dla typu LINK" },
          { status: 400 }
        );
      }
      content = link;
    } else if (type === "PDF") {
      if (!file) {
        return NextResponse.json(
          { error: "Plik jest wymagany dla typu PDF" },
          { status: 400 }
        );
      }

      // Validate file type
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Tylko pliki PDF są dozwolone" },
          { status: 400 }
        );
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "public", "uploads", "materials");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`;
      const filepath = join(uploadsDir, filename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      content = `/uploads/materials/${filename}`;
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
    console.error("Error uploading material:", error);
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
