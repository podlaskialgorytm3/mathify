import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teacherId, planId } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: "ID nauczyciela jest wymagane" },
        { status: 400 }
      );
    }

    // Verify teacher exists and is a teacher
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId, role: "TEACHER" },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Nie znaleziono nauczyciela" },
        { status: 404 }
      );
    }

    // If planId is provided, verify it exists
    if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return NextResponse.json(
          { error: "Nie znaleziono planu" },
          { status: 404 }
        );
      }
    }

    // Update teacher's plan (null to remove plan)
    const updatedTeacher = await prisma.user.update({
      where: { id: teacherId },
      data: {
        planId: planId || null,
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      message: planId
        ? "Plan został przypisany do nauczyciela"
        : "Plan został usunięty z nauczyciela",
      teacher: {
        id: updatedTeacher.id,
        firstName: updatedTeacher.firstName,
        lastName: updatedTeacher.lastName,
        email: updatedTeacher.email,
        plan: updatedTeacher.plan,
      },
    });
  } catch (error: any) {
    console.error("Error assigning plan:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas przypisywania planu" },
      { status: 500 }
    );
  }
}
