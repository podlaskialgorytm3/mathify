import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compileLatex } from "@/lib/latex";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { z } from "zod";

const publishSchema = z.object({
  subchapterId: z.string().cuid().optional(), // required only for first publish (when materialId is null)
  title: z
    .string()
    .min(1, "Tytuł nie może być pusty")
    .max(200, "Tytuł może mieć maksymalnie 200 znaków")
    .regex(
      /^[^-\\/:|*?"<>\x00]+$/,
      'Tytuł zawiera niedozwolone znaki. Nie używaj myślnika (-) ani znaków: \\ / : | * ? " < >'
    ),
});

// POST /api/teacher/latex-documents/[id]/publish
// Final compilation → upload PDF to Cloudinary → create or update Material + MaterialSubchapter
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }

  const { id } = await params;
  const doc = await prisma.latexDocument.findUnique({
    where: { id },
    include: {
      material: {
        select: { id: true, content: true },
      },
    },
  });

  if (!doc) {
    return Response.json({ error: "Nie znaleziono dokumentu" }, { status: 404 });
  }

  if (doc.ownerId !== session.user.id) {
    return new Response("Brak dostępu", { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Nieprawidłowe dane", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { subchapterId, title } = parsed.data;

  // First publish requires subchapterId
  if (!doc.materialId && !subchapterId) {
    return Response.json(
      { error: "Brak subchapterId — wymagany przy pierwszej publikacji" },
      { status: 400 }
    );
  }

  // Step 1: Compile LaTeX → PDF buffer
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await compileLatex(doc.sourceCode);
  } catch (error: any) {
    return Response.json(
      {
        error: "Błąd kompilacji LaTeX",
        log: error.log ?? error.message ?? "Nieznany błąd",
      },
      { status: 422 }
    );
  }

  // Step 2: Upload new PDF to Cloudinary
  let newUrl: string;
  let newPublicId: string;
  try {
    const result = await uploadBufferToCloudinary(
      pdfBuffer,
      `${title}.pdf`,
      "application/pdf",
      "mathify/latex-materials"
    );
    newUrl = result.url;
    newPublicId = result.publicId;
  } catch (error: any) {
    return Response.json(
      { error: "Błąd uploadu do Cloudinary", details: error.message },
      { status: 500 }
    );
  }

  try {
    if (doc.materialId && doc.material) {
      // ── EDIT: update existing Material, replace PDF file ──
      const oldContent = doc.material.content;

      // Update material title + content, and sync the LatexDocument title
      await prisma.$transaction([
        prisma.material.update({
          where: { id: doc.materialId },
          data: { title, content: newUrl },
        }),
        prisma.latexDocument.update({
          where: { id: doc.id },
          data: { title },
        }),
      ]);

      // Delete old file from Cloudinary only AFTER successful update
      // (so we never end up with a Material pointing to a deleted file)
      if (oldContent && oldContent !== newUrl) {
        // Extract publicId from the URL (Cloudinary URL format)
        // The publicId is the path after /upload/vXXX/ without extension
        const publicIdMatch = oldContent.match(/\/upload\/(?:v\d+\/)?(.+?)\.[^.]+$/);
        if (publicIdMatch) {
          await deleteFromCloudinary(publicIdMatch[1]).catch(() => {
            console.warn("[publish] Failed to delete old Cloudinary file:", oldContent);
          });
        }
      }

      return Response.json({ pdfUrl: newUrl, materialId: doc.materialId });
    } else {
      // ── FIRST PUBLISH: create new Material + MaterialSubchapter ──
      // data-disk model: Material ↔ Subchapter via MaterialSubchapter (N:N)
      const result = await prisma.$transaction(async (tx) => {
        // Find the max order in this subchapter for proper ordering
        const maxOrderEntry = await tx.materialSubchapter.findFirst({
          where: { subchapterId: subchapterId! },
          orderBy: { order: "desc" },
          select: { order: true },
        });
        const nextOrder = (maxOrderEntry?.order ?? -1) + 1;

        // Create Material
        const material = await tx.material.create({
          data: {
            title,
            type: "PDF",
            content: newUrl,
            source: "COURSE",
            ownerId: session.user.id,
          },
        });

        // Link Material to Subchapter via MaterialSubchapter
        await tx.materialSubchapter.create({
          data: {
            materialId: material.id,
            subchapterId: subchapterId!,
            order: nextOrder,
          },
        });

        // Link LatexDocument to Material (1:1) and sync its title
        await tx.latexDocument.update({
          where: { id: doc.id },
          data: { materialId: material.id, title },
        });

        return material;
      });

      return Response.json({ pdfUrl: newUrl, materialId: result.id }, { status: 201 });
    }
  } catch (error: any) {
    // If DB transaction failed after upload — try to clean up the newly uploaded file
    await deleteFromCloudinary(newPublicId).catch(() => {});
    return Response.json(
      { error: "Błąd zapisu w bazie danych", details: error.message },
      { status: 500 }
    );
  }
}
