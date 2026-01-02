import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Lista wszystkich szablonów nauczyciela
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.aIPromptTemplate.findMany({
      where: {
        teacherId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching AI prompt templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Tworzenie nowego szablonu
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, prompt, description } = body;

    if (!name || !prompt) {
      return NextResponse.json(
        { error: "Nazwa i prompt są wymagane" },
        { status: 400 }
      );
    }

    const template = await prisma.aIPromptTemplate.create({
      data: {
        teacherId: session.user.id,
        name,
        prompt,
        description: description || null,
      },
    });

    return NextResponse.json(
      {
        message: "Szablon został utworzony",
        prompt: template,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating AI prompt template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
