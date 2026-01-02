import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSignedUrl } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "publicId is required" },
        { status: 400 }
      );
    }

    // Generate signed URL (valid for 1 hour)
    const signedUrl = getSignedUrl(publicId);

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}
