import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compileLatex, isTectonicAvailable } from "@/lib/latex";

// POST /api/teacher/latex-templates/[id]/compile
// Compiles the template source code to PDF and returns a base64 PDF (live preview).
// Reuses the exact same compileLatex() implementation as documents — no second engine.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const { id } = await params;
  const template = await prisma.latexTemplate.findUnique({ where: { id } });

  if (!template) {
    return Response.json({ error: "Nie znaleziono szablonu" }, { status: 404 });
  }

  if (template.ownerId !== session.user.id) {
    return new Response("Brak dostępu", { status: 403 });
  }

  const available = await isTectonicAvailable();
  if (!available) {
    return Response.json(
      {
        success: false,
        error:
          "Silnik LaTeX (tectonic) nie jest dostępny w tym środowisku. " +
          "Upewnij się, że aplikacja działa w kontenerze Docker z zainstalowanym tectonic.",
        log: "tectonic: command not found",
      },
      { status: 503 }
    );
  }

  // Optionally override sourceCode from request body (compile-before-save)
  let sourceCode = template.sourceCode;
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

    return Response.json({
      success: true,
      pdfBase64: pdfBuffer.toString("base64"),
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
