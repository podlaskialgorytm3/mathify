import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Settings will be stored in a simple key-value table
// For now, we'll use a simple approach with environment variables
// In production, you'd want a proper settings table

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
    }

    // Get statistics
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      totalCourses,
      totalTeachers,
      totalStudents,
      totalSubmissions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.course.count(),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.submission.count(),
    ]);

    const settings = {
      statistics: {
        totalUsers,
        activeUsers,
        pendingUsers,
        totalCourses,
        totalTeachers,
        totalStudents,
        totalSubmissions,
      },
      email: {
        configured: !!(
          process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD
        ),
        host: process.env.EMAIL_SERVER_HOST || "",
        port: process.env.EMAIL_SERVER_PORT || "587",
        from: process.env.EMAIL_FROM || "",
      },
      ai: {
        testMode: process.env.AI_TEST_MODE === "true",
        configured: !!process.env.GEMINI_API_KEY,
      },
      app: {
        url: process.env.NEXT_PUBLIC_APP_URL || "",
      },
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Błąd pobierania ustawień" },
      { status: 500 }
    );
  }
}
