import { MAX_PDF_SIZE_BYTES } from "./constants";

/** Czy plik mieści się w limicie aplikacji (plik dokładnie na limicie jest akceptowany). */
export function isPdfWithinLimit(
  file: { size: number },
  limit: number = MAX_PDF_SIZE_BYTES
): boolean {
  return file.size <= limit;
}

/** Rozmiar pliku w megabajtach (MiB). */
export function getFileSizeInMb(file: { size: number }): number {
  return file.size / (1024 * 1024);
}

/** Rozmiar w formacie czytelnym dla użytkownika, np. "2.75 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Procentowa redukcja rozmiaru pliku (0 gdy plik nie zmalał). */
export function getSizeReductionPercent(
  originalBytes: number,
  finalBytes: number
): number {
  if (originalBytes <= 0 || finalBytes >= originalBytes) {
    return 0;
  }

  return Math.round(((originalBytes - finalBytes) / originalBytes) * 100);
}
