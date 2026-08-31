/**
 * Statusy procesu przygotowania i wysyłki pliku PDF.
 * Jawny stan pozwala UI reagować na każdy etap (walidacja / kompresja / upload).
 */

import type { PdfUploadErrorCode } from "./errors";

export type PdfUploadStatus =
  | { type: "idle" }
  | { type: "validating" }
  | { type: "compressing"; attempt: number; maxAttempts: number }
  | { type: "uploading" }
  | { type: "success" }
  | { type: "error"; code: PdfUploadErrorCode; message: string };

export interface CompressionAttemptInfo {
  attempt: number;
  maxAttempts: number;
  sizeBefore: number;
  sizeAfter: number;
}

export interface PreparePdfResult {
  /** Plik gotowy do wysłania na serwer. */
  file: File;
  /** Rozmiar oryginalnego pliku wybranego przez użytkownika. */
  originalSize: number;
  /** Liczba faktycznie wykonanych iteracji kompresji (0 = plik był od razu OK). */
  attempts: number;
  /** Czy plik został skompresowany. */
  compressed: boolean;
}

export type PdfCompressor = (file: File, attempt: number) => Promise<File>;
