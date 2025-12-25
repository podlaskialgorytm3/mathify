import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const courseId = searchParams.get("courseId");

    if (!query || query.length < 2) {
      return NextResponse.json({ students: [] });
    }

    // Wyszukaj uczniów
    const whereClause: any = {
      role: "STUDENT",
      status: "ACTIVE",
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
      ],
    };

    // Jeśli podano courseId, wyklucz uczniów już zapisanych na ten kurs
    if (courseId) {
      whereClause.enrolledCourses = {
        none: {
          courseId: courseId,
        },
      };
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        status: true,
        enrolledCourses: {
          select: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: {
        lastName: "asc",
      },
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    );
  }
}
