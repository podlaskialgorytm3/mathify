import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    console.log("Testing Cloudinary URL:", url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mathify-Test/1.0",
      },
    });

    clearTimeout(timeout);

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `HTTP ${response.status}`,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sprawdź czy to PDF
    const pdfHeader = buffer.slice(0, 4).toString();
    const isPDF = pdfHeader.startsWith("%PDF");

    return NextResponse.json({
      success: true,
      contentType,
      contentLength,
      actualSize: buffer.length,
      isPDF,
      header: pdfHeader,
    });
  } catch (error) {
    console.error("Error testing URL:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 }
    );
  }
}
