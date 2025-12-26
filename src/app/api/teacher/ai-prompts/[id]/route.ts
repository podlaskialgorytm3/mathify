import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Pobierz pojedynczy szablon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.aIPromptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Szablon nie został znaleziony" },
        { status: 404 }
      );
    }

    if (template.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching AI prompt template:", error);
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// PUT - Aktualizuj szablon
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, prompt, description } = body;

    const template = await prisma.aIPromptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Szablon nie został znaleziony" },
        { status: 404 }
      );
    }

    if (template.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedTemplate = await prisma.aIPromptTemplate.update({
      where: { id },
      data: {
        name: name || template.name,
        prompt: prompt || template.prompt,
        description:
          description !== undefined ? description : template.description,
      },
    });

    return NextResponse.json({
      message: "Szablon został zaktualizowany",
      template: updatedTemplate,
    });
  } catch (error) {
    console.error("Error updating AI prompt template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE - Usuń szablon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.aIPromptTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Szablon nie został znaleziony" },
        { status: 404 }
      );
    }

    if (template.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.aIPromptTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Szablon został usunięty",
    });
  } catch (error) {
    console.error("Error deleting AI prompt template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
