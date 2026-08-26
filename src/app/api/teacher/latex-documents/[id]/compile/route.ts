import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compileLatex, isTectonicAvailable } from "@/lib/latex";

// POST /api/teacher/latex-documents/[id]/compile
// Compiles the current sourceCode to PDF and returns a base64 PDF (for live preview).
// Does NOT save the PDF permanently — that's the job of /publish.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const { id } = await params;
  const document = await prisma.latexDocument.findUnique({ where: { id } });

  if (!document) {
    return Response.json({ error: "Nie znaleziono dokumentu" }, { status: 404 });
  }

  if (document.ownerId !== session.user.id) {
    return new Response("Brak dostępu", { status: 403 });
  }

  // Check if tectonic is available (useful in dev environments without Docker)
  const available = await isTectonicAvailable();
  if (!available) {
    return Response.json(
      {
        success: false,
        error: "Silnik LaTeX (tectonic) nie jest dostępny w tym środowisku. " +
               "Upewnij się, że aplikacja działa w kontenerze Docker z zainstalowanym tectonic.",
        log: "tectonic: command not found",
      },
      { status: 503 }
    );
  }

  // Optionally override sourceCode from request body (for compile-before-save)
  let sourceCode = document.sourceCode;
  try {
    const body = await req.json();
    if (typeof body?.sourceCode === "string") {
      sourceCode = body.sourceCode;
    }
  } catch {
    // Body is optional — use saved sourceCode
  }

  try {
    const pdfBuffer = await compileLatex(sourceCode);
    const base64 = pdfBuffer.toString("base64");

    return Response.json({
      success: true,
      pdfBase64: base64,
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message ?? "Nieznany błąd kompilacji",
        log: error.log ?? "",
      },
      { status: 422 }
    );
  }
}
