/**
 * Testy jednostkowe kompresora PDF (dokumentacja: sekcja 42).
 *
 * Logika trzech iteracji jest testowana niezależnie od biblioteki PDF —
 * kompresor jest wstrzykiwany, więc testy nie potrzebują przeglądarki.
 */

import {
  COMPRESSION_LIMIT_MESSAGE,
  MAX_COMPRESSION_ATTEMPTS,
  MAX_PDF_SIZE_BYTES,
  formatFileSize,
  getFileSizeInMb,
  getSizeReductionPercent,
  isPdfWithinLimit,
  preparePdfForUpload,
} from "@/lib/pdf-compression";
import {
  CompressionFailedError,
  CompressionLimitError,
  EmptyPdfError,
  FileRequiredError,
  InvalidPdfError,
  isPdfUploadError,
} from "@/lib/pdf-compression/errors";
import {
  hasPdfSignature,
  validatePdf,
  validatePdfFile,
} from "@/lib/pdf-compression/validation";

const MB = 1024 * 1024;

/** Tworzy plik o zadanym rozmiarze z poprawną sygnaturą PDF. */
function makePdfFile(sizeInBytes: number, name = "praca.pdf"): File {
  const bytes = new Uint8Array(Math.floor(sizeInBytes));
  const header = "%PDF-1.7";
  for (let i = 0; i < Math.min(header.length, sizeInBytes); i++) {
    bytes[i] = header.charCodeAt(i);
  }
  return new File([bytes], name, { type: "application/pdf" });
}

/** Kompresor zwracający po kolei podane rozmiary. */
function fakeCompressor(sizes: number[]) {
  const calls: number[] = [];
  const compress = jest.fn(async (file: File, attempt: number) => {
    calls.push(file.size);
    const nextSize = sizes[attempt - 1] ?? sizes[sizes.length - 1];
    return makePdfFile(nextSize, file.name);
  });

  return { compress, calls };
}

describe("stałe i pomocnicze funkcje rozmiaru", () => {
  it("limit 3 MB jest zdefiniowany jako 3 * 1024 * 1024", () => {
    expect(MAX_PDF_SIZE_BYTES).toBe(3 * 1024 * 1024);
    expect(MAX_COMPRESSION_ATTEMPTS).toBe(3);
  });

  it("plik dokładnie na limicie mieści się w limicie", () => {
    expect(isPdfWithinLimit({ size: MAX_PDF_SIZE_BYTES })).toBe(true);
    expect(isPdfWithinLimit({ size: MAX_PDF_SIZE_BYTES + 1 })).toBe(false);
  });

  it("przelicza i formatuje rozmiar pliku", () => {
    expect(getFileSizeInMb({ size: 2 * MB })).toBe(2);
    expect(formatFileSize(2.5 * MB)).toBe("2.50 MB");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(512)).toBe("512 B");
  });

  it("liczy procentową redukcję rozmiaru", () => {
    expect(getSizeReductionPercent(10 * MB, 5 * MB)).toBe(50);
    expect(getSizeReductionPercent(10 * MB, 12 * MB)).toBe(0);
  });
});

describe("walidacja pliku", () => {
  it("odrzuca brak pliku", () => {
    expect(() => validatePdf(null)).toThrow(FileRequiredError);
  });

  it("odrzuca plik, który nie jest PDF-em", () => {
    const file = new File(["abc"], "zdjecie.png", { type: "image/png" });
    expect(() => validatePdf(file)).toThrow(InvalidPdfError);
  });

  it("odrzuca plik o zerowym rozmiarze", () => {
    const file = new File([], "praca.pdf", { type: "application/pdf" });
    expect(() => validatePdf(file)).toThrow(EmptyPdfError);
  });

  it("akceptuje poprawny PDF", async () => {
    const file = makePdfFile(1024);
    await expect(validatePdfFile(file)).resolves.toBe(file);
  });

  it("odrzuca plik z rozszerzeniem .pdf, który nie jest PDF-em", async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4, 5, 6])], "praca.pdf", {
      type: "application/pdf",
    });
    await expect(validatePdfFile(file)).rejects.toBeInstanceOf(InvalidPdfError);
  });

  it("rozpoznaje sygnaturę PDF w buforze (walidacja backendowa)", () => {
    expect(
      hasPdfSignature(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))
    ).toBe(true);
    expect(hasPdfSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(
      false
    );
  });
});

describe("preparePdfForUpload — algorytm trzech iteracji", () => {
  it("Test 1 — plik mniejszy niż limit nie jest kompresowany", async () => {
    const { compress } = fakeCompressor([1 * MB]);
    const file = makePdfFile(2 * MB);

    const result = await preparePdfForUpload(file, { compress });

    expect(compress).not.toHaveBeenCalled();
    expect(result.file).toBe(file);
    expect(result.compressed).toBe(false);
    expect(result.attempts).toBe(0);
  });

  it("Test 2 — plik dokładnie na limicie nie jest kompresowany", async () => {
    const { compress } = fakeCompressor([1 * MB]);
    const file = makePdfFile(MAX_PDF_SIZE_BYTES);

    const result = await preparePdfForUpload(file, { compress });

    expect(compress).not.toHaveBeenCalled();
    expect(result.file.size).toBe(MAX_PDF_SIZE_BYTES);
  });

  it("Test 3 — plik większy niż limit uruchamia kompresję", async () => {
    const { compress } = fakeCompressor([2.8 * MB]);

    await preparePdfForUpload(makePdfFile(5 * MB), { compress });

    expect(compress).toHaveBeenCalled();
  });

  it("Test 4 — sukces po pierwszej próbie", async () => {
    const { compress } = fakeCompressor([2.8 * MB]);

    const result = await preparePdfForUpload(makePdfFile(5 * MB), { compress });

    expect(compress).toHaveBeenCalledTimes(1);
    expect(result.attempts).toBe(1);
    expect(result.compressed).toBe(true);
    expect(result.file.size).toBe(Math.floor(2.8 * MB));
    expect(result.originalSize).toBe(5 * MB);
  });

  it("Test 5 — sukces po drugiej próbie", async () => {
    const { compress } = fakeCompressor([4.5 * MB, 2.9 * MB]);

    const result = await preparePdfForUpload(makePdfFile(7 * MB), { compress });

    expect(compress).toHaveBeenCalledTimes(2);
    expect(result.attempts).toBe(2);
    expect(result.file.size).toBe(Math.floor(2.9 * MB));
  });

  it("Test 6 — sukces po trzeciej próbie", async () => {
    const { compress } = fakeCompressor([7 * MB, 5 * MB, 2.9 * MB]);

    const result = await preparePdfForUpload(makePdfFile(10 * MB), {
      compress,
    });

    expect(compress).toHaveBeenCalledTimes(3);
    expect(result.attempts).toBe(3);
    expect(result.file.size).toBe(Math.floor(2.9 * MB));
  });

  it("Test 7 — brak możliwości kompresji kończy się błędem po 3 próbach", async () => {
    const { compress } = fakeCompressor([8 * MB, 7 * MB, 6 * MB]);

    await expect(
      preparePdfForUpload(makePdfFile(10 * MB), { compress })
    ).rejects.toBeInstanceOf(CompressionLimitError);

    expect(compress).toHaveBeenCalledTimes(3);
  });

  it("Test 7b — komunikat błędu jest zgodny z dokumentacją", async () => {
    const { compress } = fakeCompressor([8 * MB, 7 * MB, 6 * MB]);

    await expect(
      preparePdfForUpload(makePdfFile(10 * MB), { compress })
    ).rejects.toThrow(COMPRESSION_LIMIT_MESSAGE);
  });

  it("Test 8 — wyjątek kompresora przerywa proces", async () => {
    const compress = jest.fn(async () => {
      throw new CompressionFailedError();
    });

    const error = await preparePdfForUpload(makePdfFile(5 * MB), {
      compress,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(CompressionFailedError);
    expect(isPdfUploadError(error) && error.code).toBe("COMPRESSION_FAILED");
    expect(compress).toHaveBeenCalledTimes(1);
  });

  it("każda kolejna próba pracuje na wyniku poprzedniej, nie na oryginale", async () => {
    const { compress, calls } = fakeCompressor([8 * MB, 6 * MB, 4 * MB]);

    await preparePdfForUpload(makePdfFile(10 * MB), { compress }).catch(
      () => null
    );

    expect(calls).toEqual([10 * MB, 8 * MB, 6 * MB]);
  });

  it("nie wykonuje nieskończonej pętli — limit prób jest respektowany", async () => {
    const compress = jest.fn(async (file: File) => file);

    await preparePdfForUpload(makePdfFile(50 * MB), { compress }).catch(
      () => null
    );

    expect(compress).toHaveBeenCalledTimes(MAX_COMPRESSION_ATTEMPTS);
  });

  it("raportuje postęp kolejnych prób do UI", async () => {
    const { compress } = fakeCompressor([4 * MB, 2.5 * MB]);
    const started: number[] = [];
    const finished: Array<{ sizeBefore: number; sizeAfter: number }> = [];

    await preparePdfForUpload(makePdfFile(6 * MB), {
      compress,
      onAttemptStart: (attempt) => started.push(attempt),
      onAttemptFinish: (info) =>
        finished.push({ sizeBefore: info.sizeBefore, sizeAfter: info.sizeAfter }),
    });

    expect(started).toEqual([1, 2]);
    expect(finished).toEqual([
      { sizeBefore: 6 * MB, sizeAfter: 4 * MB },
      { sizeBefore: 4 * MB, sizeAfter: 2.5 * MB },
    ]);
  });
});
