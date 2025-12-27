import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pobierz dane użytkownika
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Usuń poprzednie nieużyte tokeny resetowania hasła
    await prisma.verificationToken.deleteMany({
      where: {
        userId: session.user.id,
        type: "PASSWORD_RESET",
        used: false,
      },
    });

    // Wygeneruj token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 godzina

    // Zapisz token w bazie
    await prisma.verificationToken.create({
      data: {
        userId: session.user.id,
        token,
        type: "PASSWORD_RESET",
        expiresAt,
      },
    });

    // Wyślij email z linkiem resetującym
    await sendPasswordResetEmail(
      user.email,
      token,
      `${user.firstName} ${user.lastName}`
    );

    return NextResponse.json({
      message: "Password reset email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return NextResponse.json(
      { error: "Failed to request password reset" },
      { status: 500 }
    );
  }
}
