import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const colleagues = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        status: "ACTIVE",
        id: { not: session.user.id },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: {
        lastName: "asc",
      },
    });

    return NextResponse.json({ colleagues });
  } catch (error) {
    console.error("Error fetching colleagues:", error);
    return NextResponse.json(
      { error: "Błąd pobierania listy nauczycieli" },
      { status: 500 }
    );
  }
}
