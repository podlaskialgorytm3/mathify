/**
 * Testy modułu kompresji PDF (`compressor.ts`).
 *
 * `pdfjs-dist` oraz canvas przeglądarki są zamockowane — testujemy realny
 * przepływ kompresji: rasteryzacja strony → JPEG → złożenie dokumentu przez
 * `pdf-lib` → weryfikacja poprawności wyniku.
 */

import { Jimp } from "jimp";
import { PDFDocument } from "pdf-lib";

import { compressPdf } from "@/lib/pdf-compression/compressor";
import { CompressionFailedError } from "@/lib/pdf-compression/errors";

const getDocumentMock = jest.fn();
const renderMock = jest.fn(() => ({ promise: Promise.resolve() }));

jest.mock("@/lib/pdf-compression/pdfjs-loader", () => ({
  loadPdfJs: jest.fn(async () => ({
    GlobalWorkerOptions: { workerSrc: "" },
    getDocument: (...args: unknown[]) => getDocumentMock(...args),
  })),
}));

let jpegBytes: Uint8Array;
const toBlobCalls: Array<{ type: string; quality: number }> = [];

function makeSourceFile(sizeInBytes: number, name = "praca.pdf"): File {
  const bytes = new Uint8Array(sizeInBytes);
  const header = "%PDF-1.7";
  for (let i = 0; i < header.length; i++) {
    bytes[i] = header.charCodeAt(i);
  }
  return new File([bytes], name, { type: "application/pdf" });
}

function mockPdfDocument(numPages: number) {
  const destroy = jest.fn(async () => undefined);

  getDocumentMock.mockImplementation(() => ({
    promise: Promise.resolve({
      numPages,
      getPage: jest.fn(async () => ({
        getViewport: ({ scale }: { scale: number }) => ({
          width: 595 * scale,
          height: 842 * scale,
        }),
        render: renderMock,
        cleanup: jest.fn(),
      })),
      destroy,
    }),
  }));

  return { destroy };
}

beforeAll(async () => {
  const image = new Jimp({ width: 40, height: 60, color: 0xffffffff });
  const buffer = await image.getBuffer("image/jpeg", { quality: 60 });
  jpegBytes = new Uint8Array(buffer);

  // Minimalny stub przeglądarki wymagany przez kompresor.
  (globalThis as Record<string, unknown>).window = globalThis;
  (globalThis as Record<string, unknown>).document = {
    createElement: (tag: string) => {
      if (tag !== "canvas") {
        throw new Error(`Unexpected element: ${tag}`);
      }

      return {
        width: 0,
        height: 0,
        getContext: () => ({
          fillStyle: "",
          fillRect: jest.fn(),
        }),
        toBlob: (
          callback: (blob: Blob | null) => void,
          type: string,
          quality: number
        ) => {
          toBlobCalls.push({ type, quality });
          callback(new Blob([jpegBytes], { type }));
        },
      };
    },
  };
});

afterAll(() => {
  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).document;
});

beforeEach(() => {
  toBlobCalls.length = 0;
  renderMock.mockClear();
  getDocumentMock.mockReset();
});

describe("compressPdf", () => {
  it("zwraca poprawny, mniejszy plik PDF o oryginalnej nazwie", async () => {
    mockPdfDocument(3);
    const source = makeSourceFile(4 * 1024 * 1024, "moja-praca.pdf");

    const result = await compressPdf(source, 1);

    expect(result.name).toBe("moja-praca.pdf");
    expect(result.type).toBe("application/pdf");
    expect(result.size).toBeLessThan(source.size);

    // Warunek minimalny z dokumentacji: wynik musi dać się otworzyć jako PDF.
    const parsed = await PDFDocument.load(await result.arrayBuffer());
    expect(parsed.getPageCount()).toBe(3);

    const [page] = parsed.getPages();
    expect(Math.round(page.getWidth())).toBe(595);
    expect(Math.round(page.getHeight())).toBe(842);
  });

  it("renderuje każdą stronę dokumentu", async () => {
    mockPdfDocument(5);

    await compressPdf(makeSourceFile(4 * 1024 * 1024), 1);

    expect(renderMock).toHaveBeenCalledTimes(5);
  });

  it("kolejne próby używają agresywniejszych parametrów kompresji", async () => {
    mockPdfDocument(1);
    await compressPdf(makeSourceFile(4 * 1024 * 1024), 1);
    const firstQuality = toBlobCalls[0].quality;

    toBlobCalls.length = 0;
    mockPdfDocument(1);
    await compressPdf(makeSourceFile(4 * 1024 * 1024), 3);
    const thirdQuality = toBlobCalls[0].quality;

    expect(toBlobCalls[0].type).toBe("image/jpeg");
    expect(thirdQuality).toBeLessThan(firstQuality);
  });

  it("nie powiększa pliku — gdy wynik jest większy, zwraca oryginał", async () => {
    mockPdfDocument(1);
    const source = makeSourceFile(1024, "maly.pdf");

    const result = await compressPdf(source, 1);

    expect(result).toBe(source);
  });

  it("zwalnia zasoby dokumentu źródłowego", async () => {
    const { destroy } = mockPdfDocument(2);

    await compressPdf(makeSourceFile(4 * 1024 * 1024), 1);

    expect(destroy).toHaveBeenCalled();
  });

  it("błąd biblioteki jest raportowany jako CompressionFailedError", async () => {
    getDocumentMock.mockImplementation(() => ({
      promise: Promise.reject(new Error("Invalid PDF structure")),
    }));

    await expect(
      compressPdf(makeSourceFile(4 * 1024 * 1024), 1)
    ).rejects.toBeInstanceOf(CompressionFailedError);
  });
});
