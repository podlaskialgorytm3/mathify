import { EmptyPdfError, FileRequiredError, InvalidPdfError } from "./errors";

const PDF_MAGIC_BYTES = "%PDF-";

/**
 * Podstawowa walidacja wejścia: istnienie pliku, rozszerzenie, MIME type, rozmiar.
 *
 * Uwaga: to jest walidacja UX, a nie zabezpieczenie — backend musi
 * wykonać własną walidację niezależnie od tego, co zrobił frontend.
 */
export function validatePdf(file: File | null | undefined): asserts file is File {
  if (!file) {
    throw new FileRequiredError();
  }

  const hasPdfExtension = /\.pdf$/i.test(file.name || "");
  const hasPdfMimeType =
    file.type === "application/pdf" || file.type === "application/x-pdf";

  if (!hasPdfExtension && !hasPdfMimeType) {
    throw new InvalidPdfError();
  }

  if (file.size === 0) {
    throw new EmptyPdfError();
  }
}

/**
 * Głębsza walidacja — sprawdza rzeczywistą sygnaturę pliku (`%PDF-`).
 * Rozszerzenie i MIME type podane przez przeglądarkę są niewystarczające.
 */
export async function assertPdfSignature(file: File): Promise<void> {
  const header = await readHeader(file, PDF_MAGIC_BYTES.length);

  if (header !== PDF_MAGIC_BYTES) {
    throw new InvalidPdfError();
  }
}

/** Pełna walidacja frontendowa: metadane + sygnatura pliku. */
export async function validatePdfFile(
  file: File | null | undefined
): Promise<File> {
  validatePdf(file);
  await assertPdfSignature(file);
  return file;
}

/** Czy bufor zawiera dokument PDF (używane również po stronie backendu). */
export function hasPdfSignature(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_MAGIC_BYTES.length) {
    return false;
  }

  for (let i = 0; i < PDF_MAGIC_BYTES.length; i++) {
    if (bytes[i] !== PDF_MAGIC_BYTES.charCodeAt(i)) {
      return false;
    }
  }

  return true;
}

async function readHeader(file: File, length: number): Promise<string> {
  const slice = file.slice(0, length);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let header = "";
  for (let i = 0; i < bytes.length; i++) {
    header += String.fromCharCode(bytes[i]);
  }

  return header;
}
