/**
 * Błędy procesu przygotowania i przesyłania pliku PDF.
 *
 * Frontend musi rozróżniać powody niepowodzenia — inny komunikat należy się
 * użytkownikowi, gdy plik nie jest PDF-em, inny gdy kompresja nie dała rady,
 * a jeszcze inny gdy problem leży po stronie serwera/hostingu.
 */

export type PdfUploadErrorCode =
  | "FILE_REQUIRED"
  | "INVALID_FILE"
  | "EMPTY_FILE"
  | "COMPRESSION_FAILED"
  | "COMPRESSION_LIMIT_REACHED"
  | "FILE_TOO_LARGE"
  | "UPLOAD_FAILED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR";

export class PdfUploadError extends Error {
  readonly code: PdfUploadErrorCode;

  constructor(code: PdfUploadErrorCode, message: string) {
    super(message);
    this.name = "PdfUploadError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Nie wybrano pliku. */
export class FileRequiredError extends PdfUploadError {
  constructor(message = "Nie wybrano pliku PDF") {
    super("FILE_REQUIRED", message);
    this.name = "FileRequiredError";
  }
}

/** Plik nie jest poprawnym dokumentem PDF. */
export class InvalidPdfError extends PdfUploadError {
  constructor(message = "Wybrany plik nie jest poprawnym dokumentem PDF") {
    super("INVALID_FILE", message);
    this.name = "InvalidPdfError";
  }
}

/** Plik ma zerowy rozmiar (uszkodzony / pusty). */
export class EmptyPdfError extends PdfUploadError {
  constructor(message = "Wybrany plik jest pusty lub uszkodzony") {
    super("EMPTY_FILE", message);
    this.name = "EmptyPdfError";
  }
}

/** Biblioteka kompresująca zwróciła błąd — to nie jest problem rozmiaru. */
export class CompressionFailedError extends PdfUploadError {
  constructor(message = "Nie udało się automatycznie przygotować pliku PDF") {
    super("COMPRESSION_FAILED", message);
    this.name = "CompressionFailedError";
  }
}

/** Po maksymalnej liczbie prób plik nadal przekracza limit. */
export class CompressionLimitError extends PdfUploadError {
  constructor(message: string) {
    super("COMPRESSION_LIMIT_REACHED", message);
    this.name = "CompressionLimitError";
  }
}

/** Plik został przygotowany, ale serwer go nie przyjął. */
export class UploadFailedError extends PdfUploadError {
  readonly status?: number;

  constructor(
    message = "Nie udało się przesłać pliku PDF",
    status?: number,
    code: PdfUploadErrorCode = "UPLOAD_FAILED"
  ) {
    super(code, message);
    this.name = "UploadFailedError";
    this.status = status;
  }
}

export function isPdfUploadError(error: unknown): error is PdfUploadError {
  return error instanceof PdfUploadError;
}
