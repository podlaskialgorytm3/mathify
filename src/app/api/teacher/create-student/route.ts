import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Generate username from first and last name
function generateUsername(firstName: string, lastName: string): string {
  // Remove Polish characters and special characters
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/[^a-z0-9]/g, "");

  const normalizedFirst = normalize(firstName);
  const normalizedLast = normalize(lastName);

  // Create base username: firstname.lastname
  return `${normalizedFirst}.${normalizedLast}`;
}

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
    const { firstName, lastName, courseIds } = body;
    let { email } = body;

    // Validation
    if (!firstName || !lastName || !courseIds || courseIds.length === 0) {
      return NextResponse.json(
        { error: "Wszystkie pola są wymagane" },
        { status: 400 }
      );
    }

    // Auto-generate email if not provided
    if (!email) {
      const username = generateUsername(firstName, lastName);
      email = `${username}@mathify.local`;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Nieprawidłowy format email" },
        { status: 400 }
      );
    }

    // Get teacher with plan
    const teacher = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        plan: true,
        createdCourses: {
          include: {
            enrollments: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Nauczyciel nie znaleziony" },
        { status: 404 }
      );
    }

    // Check plan limits if teacher has a plan
    if (teacher.plan) {
      const totalStudents = teacher.createdCourses.reduce(
        (sum, course) => sum + course.enrollments.length,
        0
      );

      // Adding students to multiple courses counts as adding courseIds.length students
      if (totalStudents + courseIds.length > teacher.plan.maxStudents) {
        return NextResponse.json(
          {
            error: `Przekroczono limit uczniów. Twój plan pozwala na maksymalnie ${teacher.plan.maxStudents} uczniów. Aktualnie masz ${totalStudents} uczniów.`,
          },
          { status: 403 }
        );
      }
    }

    // Check if courses belong to the teacher
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        teacherId: session.user.id,
      },
    });

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: "Niektóre kursy nie należą do Ciebie" },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Użytkownik z tym adresem email już istnieje" },
        { status: 400 }
      );
    }

    // Generate username
    let username = generateUsername(firstName, lastName);
    let usernameCounter = 1;

    // Check if username exists, if yes, add number suffix
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${generateUsername(firstName, lastName)}${usernameCounter}`;
      usernameCounter++;
    }

    // Generate random password
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create user with transaction
    const newStudent = await prisma.$transaction(async (tx) => {
      // Create student
      const student = await tx.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          firstName,
          lastName,
          role: "STUDENT",
          status: "ACTIVE",
          emailVerified: new Date(), // Auto-verify email for teacher-created accounts
          createdById: session.user.id,
        },
      });

      // Enroll student in courses
      await tx.courseEnrollment.createMany({
        data: courseIds.map((courseId: string) => ({
          courseId,
          studentId: student.id,
        })),
      });

      return student;
    });

    // Return success with credentials
    return NextResponse.json({
      firstName,
      lastName,
      email,
      username: newStudent.username,
      password: plainPassword, // Return plain password only once
      courses: courses.map((c) => c.title),
    });
  } catch (error: any) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas tworzenia konta ucznia" },
      { status: 500 }
    );
  }
}
