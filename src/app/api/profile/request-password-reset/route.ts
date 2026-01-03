import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Sprawdź czy użytkownik jest zalogowany
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pobierz dane zalogowanego użytkownika
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Usuń poprzednie nieużyte tokeny resetowania hasła (optional cleanup)
    try {
      await prisma.verificationToken.deleteMany({
        where: {
          userId: user.id,
          type: "PASSWORD_RESET",
          used: false,
        },
      });
    } catch (error) {
      // Ignore errors during cleanup
    }

    // Wygeneruj token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 godzina

    // Zapisz token w bazie
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
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
      message: "Password reset link has been sent to your email.",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return NextResponse.json(
      { error: "Failed to request password reset" },
      { status: 500 }
    );
  }
}
