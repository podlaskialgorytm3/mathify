/**
 * Testy integracyjne przepływu "Prześlij pracę domową → PDF"
 * (dokumentacja: sekcja 43).
 *
 * Sprawdzamy złożenie: walidacja → kompresja (jeśli trzeba) → upload,
 * z zamockowanym `fetch` zamiast prawdziwego serwera.
 */

import {
  EXTERNAL_COMPRESSOR_URL,
  preparePdfForUpload,
  uploadHomeworkPdf,
  validatePdfFile,
} from "@/lib/pdf-compression";
import {
  CompressionLimitError,
  UploadFailedError,
} from "@/lib/pdf-compression/errors";

const MB = 1024 * 1024;

function makePdfFile(sizeInBytes: number, name = "praca.pdf"): File {
  const bytes = new Uint8Array(sizeInBytes);
  const header = "%PDF-1.7";
  for (let i = 0; i < Math.min(header.length, sizeInBytes); i++) {
    bytes[i] = header.charCodeAt(i);
  }
  return new File([bytes], name, { type: "application/pdf" });
}

function okResponse(): Response {
  return new Response(JSON.stringify({ message: "ok" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(status: number, body = ""): Response {
  return new Response(body, { status });
}

interface FlowResult {
  compressions: number;
  uploads: number;
  error?: unknown;
}

/** Odwzorowuje logikę strony przesyłania pracy domowej. */
async function runSubmitFlow(
  file: File,
  compressionSizes: number[],
  fetchImpl: jest.Mock
): Promise<FlowResult> {
  let compressions = 0;

  const compress = async (input: File, attempt: number) => {
    compressions += 1;
    const size = compressionSizes[attempt - 1] ?? input.size;
    return makePdfFile(size, input.name);
  };

  try {
    const validated = await validatePdfFile(file);
    const prepared = await preparePdfForUpload(validated, { compress });

    await uploadHomeworkPdf({
      file: prepared.file,
      subchapterId: "subchapter-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    return { compressions, uploads: fetchImpl.mock.calls.length };
  } catch (error) {
    return { compressions, uploads: fetchImpl.mock.calls.length, error };
  }
}

describe("integracja: przesyłanie pracy domowej w formacie PDF", () => {
  it("Scenariusz A — PDF 2 MB jest wysyłany bez kompresji", async () => {
    const fetchImpl = jest.fn(async () => okResponse());

    const result = await runSubmitFlow(makePdfFile(2 * MB), [], fetchImpl);

    expect(result.error).toBeUndefined();
    expect(result.compressions).toBe(0);
    expect(result.uploads).toBe(1);
  });

  it("Scenariusz B — PDF 5 MB: jedna kompresja i jeden upload", async () => {
    const fetchImpl = jest.fn(async () => okResponse());

    const result = await runSubmitFlow(
      makePdfFile(5 * MB),
      [2.8 * MB],
      fetchImpl
    );

    expect(result.error).toBeUndefined();
    expect(result.compressions).toBe(1);
    expect(result.uploads).toBe(1);
  });

  it("Scenariusz C — trzy kompresje bez efektu: brak uploadu", async () => {
    const fetchImpl = jest.fn(async () => okResponse());

    const result = await runSubmitFlow(
      makePdfFile(10 * MB),
      [8 * MB, 7.9 * MB, 7.8 * MB],
      fetchImpl
    );

    expect(result.error).toBeInstanceOf(CompressionLimitError);
    expect(result.compressions).toBe(3);
    expect(result.uploads).toBe(0);
  });

  it("wysyła poprawnie zbudowane multipart/form-data", async () => {
    const fetchImpl = jest.fn(async () => okResponse());

    await uploadHomeworkPdf({
      file: makePdfFile(1 * MB, "moja-praca.pdf"),
      subchapterId: "sub-42",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit
    ];
    const body = init.body as FormData;

    expect(url).toBe("/api/student/submissions");
    expect(init.method).toBe("POST");
    expect(body.get("subchapterId")).toBe("sub-42");
    expect(body.get("uploadMode")).toBe("pdf");
    expect((body.get("file") as File).name).toBe("moja-praca.pdf");
  });

  it("Test 9 — błąd uploadu nie uruchamia dodatkowej kompresji", async () => {
    const fetchImpl = jest.fn(async () => errorResponse(500));

    const result = await runSubmitFlow(
      makePdfFile(5 * MB),
      [2.8 * MB],
      fetchImpl
    );

    expect(result.compressions).toBe(1);
    expect(result.uploads).toBe(1);
    expect(result.error).toBeInstanceOf(UploadFailedError);
    expect((result.error as UploadFailedError).code).toBe("SERVER_ERROR");
  });

  it("HTTP 413 mapuje się na komunikat z linkiem do zewnętrznej kompresji", async () => {
    const fetchImpl = jest.fn(async () => errorResponse(413));

    const error = (await uploadHomeworkPdf({
      file: makePdfFile(2 * MB),
      subchapterId: "sub-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    }).catch((e) => e)) as UploadFailedError;

    expect(error).toBeInstanceOf(UploadFailedError);
    expect(error.code).toBe("FILE_TOO_LARGE");
    expect(error.message).toContain(EXTERNAL_COMPRESSOR_URL);
  });

  it("błąd sieci jest rozróżniany od błędu serwera", async () => {
    const fetchImpl = jest.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    const error = (await uploadHomeworkPdf({
      file: makePdfFile(2 * MB),
      subchapterId: "sub-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    }).catch((e) => e)) as UploadFailedError;

    expect(error).toBeInstanceOf(UploadFailedError);
    expect(error.code).toBe("NETWORK_ERROR");
  });

  it("przekazuje komunikat błędu zwrócony przez API", async () => {
    const fetchImpl = jest.fn(async () =>
      new Response(JSON.stringify({ error: "Submission is currently disabled" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      })
    );

    const error = (await uploadHomeworkPdf({
      file: makePdfFile(1 * MB),
      subchapterId: "sub-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    }).catch((e) => e)) as UploadFailedError;

    expect(error.code).toBe("UPLOAD_FAILED");
    expect(error.message).toBe("Submission is currently disabled");
  });
});
