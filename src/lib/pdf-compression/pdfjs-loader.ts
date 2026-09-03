"use client";

/**
 * Ładowanie `pdfjs-dist` wraz z konfiguracją workera.
 *
 * Wydzielone do osobnego modułu, ponieważ `import.meta.url` (wymagane przez
 * bundler do zlokalizowania pliku workera) jest specyficzne dla środowiska
 * przeglądarki i nie powinno obciążać logiki kompresji.
 */

export type PdfJsModule = typeof import("pdfjs-dist");

let cached: Promise<PdfJsModule> | null = null;

export function loadPdfJs(): Promise<PdfJsModule> {
  if (!cached) {
    cached = import("pdfjs-dist").then((pdfjs) => {
      if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
      }

      return pdfjs;
    });
  }

  return cached;
}
