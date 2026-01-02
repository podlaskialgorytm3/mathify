import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Nie znaleziono planu" },
        { status: 404 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania planu" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Check if plan exists
    const existingPlan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Nie znaleziono planu" },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another plan
    if (name !== existingPlan.name) {
      const nameConflict = await prisma.plan.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Plan o tej nazwie już istnieje" },
          { status: 400 }
        );
      }
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        maxSubchapters: parseInt(maxSubchapters),
        maxStudents: parseInt(maxStudents),
        price: parseFloat(price),
        currency,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ plan: updatedPlan });
  } catch (error: any) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji planu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Check if plan exists
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Nie znaleziono planu" },
        { status: 404 }
      );
    }

    // Check if plan has users assigned
    if (plan._count.users > 0) {
      return NextResponse.json(
        {
          error: `Nie można usunąć planu - jest przypisany do ${plan._count.users} użytkowników. Najpierw usuń przypisania.`,
        },
        { status: 400 }
      );
    }

    await prisma.plan.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Plan został usunięty" });
  } catch (error: any) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania planu" },
      { status: 500 }
    );
  }
}
