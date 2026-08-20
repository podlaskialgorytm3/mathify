import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "STUDENT") {
      return new NextResponse("Brak dostępu", { status: 403 });
    }

    const { materialId } = await params;

    // Verify if material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return new NextResponse("Materiału nie znaleziono", { status: 404 });
    }

    await prisma.materialView.create({
      data: {
        materialId: materialId,
        studentId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error logging material view:", error);
    return new NextResponse("Wystąpił błąd podczas logowania wyświetlenia", { status: 500 });
  }
}
