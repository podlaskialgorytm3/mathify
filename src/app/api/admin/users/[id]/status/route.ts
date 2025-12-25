import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAccountApprovalEmail } from "@/lib/email";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!["PENDING", "ACTIVE", "INACTIVE"].includes(status)) {
      return NextResponse.json(
        { error: "Nieprawidłowy status" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });

    // Send email if approved
    if (status === "ACTIVE") {
      await sendAccountApprovalEmail(user.email, user.firstName);
    }

    return NextResponse.json({
      message: "Status użytkownika zaktualizowany",
      user,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji statusu" },
      { status: 500 }
    );
  }
}
