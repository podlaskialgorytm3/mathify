import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const courses = await prisma.course.findMany({
      where: {
        teacherId: session.user.id,
      },
      include: {
        _count: {
          select: {
            chapters: true,
            enrollments: true,
          },
        },
        chapters: {
          include: {
            _count: {
              select: {
                subchapters: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching teacher courses:", error);
    return NextResponse.json(
      { error: "Błąd pobierania kursów" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Tytuł jest wymagany" },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        title,
        description: description || null,
        teacherId: session.user.id,
      },
      include: {
        _count: {
          select: {
            chapters: true,
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Kurs został utworzony",
      course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Błąd tworzenia kursu" },
      { status: 500 }
    );
  }
}
