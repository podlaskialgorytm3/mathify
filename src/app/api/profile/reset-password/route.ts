import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Znajdź token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    // Sprawdź czy token nie został już użyty
    if (verificationToken.used) {
      return NextResponse.json(
        { error: "Token already used" },
        { status: 400 }
      );
    }

    // Sprawdź czy token nie wygasł
    if (new Date() > verificationToken.expiresAt) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    // Sprawdź typ tokenu
    if (verificationToken.type !== "PASSWORD_RESET") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 }
      );
    }

    // Hashuj nowe hasło
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Zaktualizuj hasło użytkownika
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { password: hashedPassword },
    });

    // Oznacz token jako użyty
    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true },
    });

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
