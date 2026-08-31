import { EXTERNAL_COMPRESSOR_URL } from "./constants";
import {
  PdfUploadError,
  UploadFailedError,
  isPdfUploadError,
} from "./errors";

export interface UploadHomeworkParams {
  file: File;
  subchapterId: string;
  endpoint?: string;
  signal?: AbortSignal;
  /** Wstrzykiwane `fetch` — ułatwia testowanie bez sieci. */
  fetchImpl?: typeof fetch;
}

const DEFAULT_ENDPOINT = "/api/student/submissions";

/**
 * Wysyła przygotowany (i ewentualnie skompresowany) PDF na istniejący
 * endpoint prac domowych. Kody HTTP mapujemy na osobne błędy, bo
 * „kompresja się nie udała” i „upload się nie udał” to dwa różne problemy.
 */
export async function uploadHomeworkPdf({
  file,
  subchapterId,
  endpoint = DEFAULT_ENDPOINT,
  signal,
  fetchImpl,
}: UploadHomeworkParams): Promise<unknown> {
  const doFetch = fetchImpl ?? fetch;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("subchapterId", subchapterId);
  formData.append("uploadMode", "pdf");

  let response: Response;

  try {
    response = await doFetch(endpoint, {
      method: "POST",
      body: formData,
      signal,
    });
  } catch (error) {
    throw new UploadFailedError(
      "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.",
      undefined,
      "NETWORK_ERROR"
    );
  }

  if (!response.ok) {
    throw mapResponseToError(response, await safeReadError(response));
  }

  return safeReadJson(response);
}

function mapResponseToError(
  response: Response,
  serverMessage?: string
): PdfUploadError {
  const status = response.status;

  if (status === 413) {
    return new UploadFailedError(
      `Serwer odrzucił plik ze względu na jego rozmiar. Spróbuj skompresować plik ręcznie: ${EXTERNAL_COMPRESSOR_URL}`,
      status,
      "FILE_TOO_LARGE"
    );
  }

  if (status >= 500) {
    return new UploadFailedError(
      serverMessage || "Serwer nie zdołał przyjąć pliku. Spróbuj ponownie.",
      status,
      "SERVER_ERROR"
    );
  }

  return new UploadFailedError(
    serverMessage || "Nie udało się przesłać pracy domowej",
    status,
    "UPLOAD_FAILED"
  );
}

async function safeReadError(response: Response): Promise<string | undefined> {
  try {
    const data = await response.clone().json();
    if (data && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // Odpowiedzi z proxy/hostingu często nie są JSON-em — to nie jest błąd krytyczny.
  }

  return undefined;
}

async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export { isPdfUploadError };
