import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Tylko nauczyciele i admini mogą uploadować
    if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    // Walidacja rozmiaru (100 MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Plik za duży. Maksymalny rozmiar: 100 MB" },
        { status: 400 }
      );
    }

    // Walidacja typu - sprawdź extension gdy MIME type jest pusty
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "video/mp4",
      "video/quicktime",
    ];

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "mp4", "mov"];

    const isValidMimeType =
      file.type === "" || allowedTypes.includes(file.type);
    const isValidExtension =
      fileExtension && allowedExtensions.includes(fileExtension);

    if (!isValidMimeType && !isValidExtension) {
      return NextResponse.json(
        {
          error: `Nieprawidłowy typ pliku. Dozwolone: PDF, JPG, PNG, MP4. Otrzymano: ${
            file.type || "brak typu"
          }, extension: ${fileExtension}`,
        },
        { status: 400 }
      );
    }

    // Upload do Cloudinary
    const result = await uploadToCloudinary(file, "mathify/materials");

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Błąd uploadu:", error);
    return NextResponse.json(
      { error: "Błąd podczas uploadu pliku" },
      { status: 500 }
    );
  }
}
