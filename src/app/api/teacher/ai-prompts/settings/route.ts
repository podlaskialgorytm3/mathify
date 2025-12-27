import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pobierz lub utwórz ustawienia systemowe
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          defaultHomeworkFileName: "Praca Domowa.pdf",
        },
      });
    }

    return NextResponse.json({
      defaultHomeworkFileName: settings.defaultHomeworkFileName,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { defaultHomeworkFileName } = body;

    // Walidacja - jeśli puste, użyj domyślnej wartości
    const fileName = defaultHomeworkFileName?.trim() || "Praca Domowa.pdf";

    // Pobierz lub utwórz ustawienia
    let settings = await prisma.systemSettings.findFirst();

    if (settings) {
      // Aktualizuj istniejące
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { defaultHomeworkFileName: fileName },
      });
    } else {
      // Utwórz nowe
      settings = await prisma.systemSettings.create({
        data: { defaultHomeworkFileName: fileName },
      });
    }

    return NextResponse.json({
      message: "Ustawienia zostały zapisane",
      defaultHomeworkFileName: settings.defaultHomeworkFileName,
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
