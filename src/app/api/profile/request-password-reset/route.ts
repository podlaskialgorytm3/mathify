import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Pobierz dane użytkownika
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      // Don't reveal that user doesn't exist - return success anyway
      return NextResponse.json({
        message: "If the email exists, a password reset link has been sent.",
      });
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
      message: "If the email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return NextResponse.json(
      { error: "Failed to request password reset" },
      { status: 500 }
    );
  }
}
