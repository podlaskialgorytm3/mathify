import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Znajdź token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
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
    if (verificationToken.type !== "EMAIL_CHANGE") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 }
      );
    }

    if (!verificationToken.newEmail) {
      return NextResponse.json(
        { error: "No new email specified" },
        { status: 400 }
      );
    }

    // Zaktualizuj email użytkownika
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { email: verificationToken.newEmail },
    });

    // Oznacz token jako użyty
    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true },
    });

    return NextResponse.json({
      message: "Email changed successfully",
      newEmail: verificationToken.newEmail,
    });
  } catch (error) {
    console.error("Error confirming email change:", error);
    return NextResponse.json(
      { error: "Failed to confirm email change" },
      { status: 500 }
    );
  }
}
