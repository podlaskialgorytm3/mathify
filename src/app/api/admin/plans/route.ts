import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await prisma.plan.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania planów" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, maxSubchapters, maxStudents, price, currency, isActive } =
      body;

    // Validation
    if (
      !name ||
      !maxSubchapters ||
      !maxStudents ||
      price === undefined ||
      !currency
    ) {
      return NextResponse.json(
        { error: "Wszystkie pola są wymagane" },
        { status: 400 }
      );
    }

    if (maxSubchapters < 1 || maxStudents < 1 || price < 0) {
      return NextResponse.json(
        { error: "Wartości muszą być dodatnie" },
        { status: 400 }
      );
    }

    // Check if plan name already exists
    const existingPlan = await prisma.plan.findUnique({
      where: { name },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: "Plan o tej nazwie już istnieje" },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        maxSubchapters: parseInt(maxSubchapters),
        maxStudents: parseInt(maxStudents),
        price: parseFloat(price),
        currency,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia planu" },
      { status: 500 }
    );
  }
}
