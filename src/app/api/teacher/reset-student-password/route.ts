import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Generate random password
function generatePassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const all = uppercase + lowercase + numbers + special;

  let password = "";

  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID jest wymagane" },
        { status: 400 }
      );
    }

    // Verify the student was created by this teacher
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
        createdById: session.user.id,
        role: "STUDENT",
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Nie znaleziono ucznia lub nie masz uprawnień" },
        { status: 404 }
      );
    }

    // Generate new password
    const newPlainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPlainPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: studentId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      username: student.username,
      password: newPlainPassword,
      firstName: student.firstName,
      lastName: student.lastName,
    });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas resetowania hasła" },
      { status: 500 }
    );
  }
}
