/**
 * Backendowa walidacja przesyłanego PDF-a (dokumentacja: sekcje 31 i 34).
 * Frontendowa kompresja nie zastępuje zabezpieczeń po stronie serwera.
 */

import { POST as createSubmission } from "@/app/api/student/submissions/route";
import { auth } from "@/lib/auth";
import { MAX_PDF_SIZE_BYTES } from "@/lib/pdf-compression/constants";

jest.mock("@/lib/auth");
jest.mock("@/lib/prisma", () => ({
  prisma: {
    submission: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    subchapter: { findUnique: jest.fn() },
    courseEnrollment: { findUnique: jest.fn() },
    materialSubchapter: { findMany: jest.fn() },
    systemSettings: { findFirst: jest.fn() },
    $transaction: jest.fn(),
    task: { createMany: jest.fn() },
    aIResult: { create: jest.fn() },
  },
}));
jest.mock("@/lib/cloudinary", () => ({
  uploadBufferToCloudinary: jest.fn(),
  deleteFromCloudinary: jest.fn(),
}));
jest.mock("@/lib/gemini", () => ({ checkSubmissionWithAI: jest.fn() }));
jest.mock("@/lib/pdf-utils", () => ({
  convertImagesToPDF: jest.fn(),
  mergePDFs: jest.fn(),
}));

function makeRequest(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("subchapterId", "subchapter-1");
  formData.append("uploadMode", "pdf");

  return new Request("http://localhost/api/student/submissions", {
    method: "POST",
    body: formData,
  }) as never;
}

function makeFile(sizeInBytes: number, withPdfSignature = true): File {
  const bytes = new Uint8Array(sizeInBytes);
  if (withPdfSignature) {
    const header = "%PDF-1.7";
    for (let i = 0; i < header.length; i++) {
      bytes[i] = header.charCodeAt(i);
    }
  } else {
    bytes.set([0x89, 0x50, 0x4e, 0x47], 0);
  }

  return new File([bytes], "praca.pdf", { type: "application/pdf" });
}

describe("POST /api/student/submissions — walidacja pliku PDF", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "student-id", role: "STUDENT" },
    });
  });

  it("odrzuca plik większy niż 3 MB kodem 413", async () => {
    const response = await createSubmission(makeRequest(makeFile(MAX_PDF_SIZE_BYTES + 1)));

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: expect.stringContaining("3 MB") })
    );
  });

  it("odrzuca plik, który nie jest PDF-em, mimo rozszerzenia .pdf", async () => {
    const response = await createSubmission(makeRequest(makeFile(1024, false)));

    expect(response.status).toBe(400);
  });

  it("odrzuca pusty plik", async () => {
    const emptyFile = new File([], "praca.pdf", { type: "application/pdf" });

    const response = await createSubmission(makeRequest(emptyFile));

    expect(response.status).toBe(400);
  });

  it("nie blokuje poprawnego pliku na etapie walidacji formatu", async () => {
    const response = await createSubmission(makeRequest(makeFile(1024)));

    // Dalej proces zatrzyma się na braku podrozdziału (mock zwraca undefined),
    // ale nie na walidacji rozmiaru/formatu.
    expect([404, 403, 500]).toContain(response.status);
  });

  it("odrzuca żądanie użytkownika bez roli STUDENT", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "teacher-id", role: "TEACHER" },
    });

    const response = await createSubmission(makeRequest(makeFile(1024)));

    expect(response.status).toBe(401);
  });
});
