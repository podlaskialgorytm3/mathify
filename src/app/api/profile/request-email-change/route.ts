import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailChangeConfirmation } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { newEmail } = body;

    if (!newEmail || !newEmail.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Sprawdź czy email nie jest już zajęty
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Pobierz dane użytkownika
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Usuń poprzednie nieużyte tokeny zmiany email
    await prisma.verificationToken.deleteMany({
      where: {
        userId: session.user.id,
        type: "EMAIL_CHANGE",
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
        type: "EMAIL_CHANGE",
        newEmail: newEmail.toLowerCase(),
        expiresAt,
      },
    });

    // Wyślij email z linkiem potwierdzającym
    await sendEmailChangeConfirmation(
      newEmail,
      token,
      `${user.firstName} ${user.lastName}`
    );

    return NextResponse.json({
      message: "Confirmation email sent. Please check your new email inbox.",
    });
  } catch (error) {
    console.error("Error requesting email change:", error);
    return NextResponse.json(
      { error: "Failed to request email change" },
      { status: 500 }
    );
  }
}
