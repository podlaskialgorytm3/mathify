"use client";

/**
 * Kompresja PDF po stronie przeglądarki.
 *
 * Strategia: rasteryzacja stron przez `pdfjs-dist` do canvasa, ponowne
 * zakodowanie jako JPEG o obniżonej jakości i złożenie nowego dokumentu
 * przez `pdf-lib`. Obie biblioteki są już zależnościami projektu, więc
 * funkcjonalność nie dokłada nowych paczek ani nie wysyła dokumentu
 * do zewnętrznego API.
 *
 * Moduł jest celowo oddzielony od UI — komponent wywołuje tylko
 * `compressPdf(file, attempt)` i nie wie nic o użytej bibliotece.
 */

import { COMPRESSION_PROFILES } from "./constants";
import { CompressionFailedError } from "./errors";

/** Maksymalna szerokość rasteryzowanej strony w pikselach (ochrona pamięci). */
const MAX_RASTER_WIDTH = 1600;

type CompressionProfile = { scale: number; quality: number };

function getProfile(attempt: number): CompressionProfile {
  const index = Math.min(
    Math.max(attempt, 1) - 1,
    COMPRESSION_PROFILES.length - 1
  );
  return COMPRESSION_PROFILES[index];
}

async function loadPdfJs() {
  const { loadPdfJs: load } = await import("./pdfjs-loader");
  return load();
}

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new CompressionFailedError());
          return;
        }

        blob
          .arrayBuffer()
          .then((buffer) => resolve(new Uint8Array(buffer)))
          .catch(() => reject(new CompressionFailedError()));
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Kompresuje pojedynczy plik PDF.
 *
 * @param file    plik wejściowy (dla kolejnych iteracji: wynik poprzedniej)
 * @param attempt numer próby (1..3) — im wyższy, tym agresywniejsze parametry
 * @returns nowy `File` o tej samej nazwie co oryginał
 */
export async function compressPdf(file: File, attempt = 1): Promise<File> {
  if (typeof window === "undefined") {
    throw new CompressionFailedError(
      "Kompresja PDF jest dostępna wyłącznie w przeglądarce"
    );
  }

  const { scale, quality } = getProfile(attempt);

  try {
    const [{ PDFDocument }, pdfjs] = await Promise.all([
      import("pdf-lib"),
      loadPdfJs(),
    ]);

    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
      data: sourceBytes,
      // Zasoby ładujemy z paczki npm, nie z sieci.
      isEvalSupported: false,
    });

    const sourceDocument = await loadingTask.promise;
    const outputDocument = await PDFDocument.create();

    try {
      for (
        let pageNumber = 1;
        pageNumber <= sourceDocument.numPages;
        pageNumber++
      ) {
        const page = await sourceDocument.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });

        const widthLimitedScale = Math.min(
          scale,
          MAX_RASTER_WIDTH / baseViewport.width
        );
        const renderScale = Math.max(widthLimitedScale, 0.3);
        const viewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));

        const context = canvas.getContext("2d");
        if (!context) {
          throw new CompressionFailedError(
            "Przeglądarka nie udostępniła kontekstu canvas"
          );
        }

        // Białe tło — JPEG nie obsługuje przezroczystości.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        } as Parameters<typeof page.render>[0]).promise;

        const jpegBytes = await canvasToJpeg(canvas, quality);
        const embeddedImage = await outputDocument.embedJpg(jpegBytes);

        const outputPage = outputDocument.addPage([
          baseViewport.width,
          baseViewport.height,
        ]);
        outputPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: baseViewport.width,
          height: baseViewport.height,
        });

        // Zwolnij pamięć canvasa jak najwcześniej.
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }
    } finally {
      await sourceDocument.destroy();
    }

    const compressedBytes = await outputDocument.save({ useObjectStreams: true });

    // Warunek minimalny: wynik musi dać się poprawnie odczytać jako PDF.
    await PDFDocument.load(compressedBytes);

    // Kompresja może zwiększyć rozmiar (np. PDF czysto tekstowy).
    // W takiej sytuacji nie pogarszamy sytuacji użytkownika.
    if (compressedBytes.byteLength >= file.size) {
      return file;
    }

    return new File([new Uint8Array(compressedBytes)], file.name, {
      type: "application/pdf",
      lastModified: Date.now(),
    });
  } catch (error) {
    if (error instanceof CompressionFailedError) {
      throw error;
    }

    throw new CompressionFailedError(
      error instanceof Error
        ? `Nie udało się skompresować pliku PDF: ${error.message}`
        : "Nie udało się skompresować pliku PDF"
    );
  }
}
