import {
  COMPRESSION_LIMIT_MESSAGE,
  MAX_COMPRESSION_ATTEMPTS,
  MAX_PDF_SIZE_BYTES,
} from "./constants";
import { CompressionLimitError } from "./errors";
import { isPdfWithinLimit } from "./file-size";
import type {
  CompressionAttemptInfo,
  PdfCompressor,
  PreparePdfResult,
} from "./types";

export interface PreparePdfOptions {
  /** Implementacja kompresji — wstrzykiwana, aby logikę dało się testować bez przeglądarki. */
  compress: PdfCompressor;
  /** Limit rozmiaru (domyślnie 3 MB). */
  maxSizeBytes?: number;
  /** Maksymalna liczba iteracji (domyślnie 3). */
  maxAttempts?: number;
  /** Callback wywoływany przed każdą próbą kompresji — do aktualizacji UI. */
  onAttemptStart?: (attempt: number, maxAttempts: number) => void;
  /** Callback wywoływany po każdej próbie kompresji — do logowania metryk. */
  onAttemptFinish?: (info: CompressionAttemptInfo) => void;
}

/**
 * Przygotowuje plik PDF do wysyłki zgodnie z regułą biznesową:
 *
 * - plik <= limitu nie jest kompresowany,
 * - plik > limitu jest kompresowany maksymalnie `maxAttempts` razy,
 * - każda kolejna próba działa na wyniku poprzedniej,
 * - po wyczerpaniu prób zgłaszany jest `CompressionLimitError`.
 */
export async function preparePdfForUpload(
  file: File,
  options: PreparePdfOptions
): Promise<PreparePdfResult> {
  const {
    compress,
    maxSizeBytes = MAX_PDF_SIZE_BYTES,
    maxAttempts = MAX_COMPRESSION_ATTEMPTS,
    onAttemptStart,
    onAttemptFinish,
  } = options;

  const originalSize = file.size;

  if (isPdfWithinLimit(file, maxSizeBytes)) {
    return {
      file,
      originalSize,
      attempts: 0,
      compressed: false,
    };
  }

  let currentFile = file;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    onAttemptStart?.(attempt, maxAttempts);

    const sizeBefore = currentFile.size;
    currentFile = await compress(currentFile, attempt);

    onAttemptFinish?.({
      attempt,
      maxAttempts,
      sizeBefore,
      sizeAfter: currentFile.size,
    });

    if (isPdfWithinLimit(currentFile, maxSizeBytes)) {
      return {
        file: currentFile,
        originalSize,
        attempts: attempt,
        compressed: true,
      };
    }
  }

  throw new CompressionLimitError(COMPRESSION_LIMIT_MESSAGE);
}
