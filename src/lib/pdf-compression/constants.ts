/**
 * Stałe biznesowe kompresora PDF.
 *
 * Wszystkie parametry funkcjonalności "Kompresor PDF" trzymamy w jednym miejscu,
 * aby nie szukać wartości "3 MB" i "3 próby" po całym projekcie.
 */

/**
 * Limit rozmiaru pliku PDF akceptowany przez aplikację.
 * 3 MB interpretujemy jako 3 * 1024 * 1024 bajtów (definicja wspólna dla FE i BE).
 */
export const MAX_PDF_SIZE_BYTES = 3 * 1024 * 1024;

/** Maksymalna liczba iteracji kompresji wykonywanych po stronie frontendu. */
export const MAX_COMPRESSION_ATTEMPTS = 3;

/** Zewnętrzne narzędzie proponowane użytkownikowi, gdy upload nie powiedzie się. */
export const EXTERNAL_COMPRESSOR_URL = "https://www.ilovepdf.com/compress_pdf";

/** Komunikat wymagany przez dokumentację funkcjonalności. */
export const COMPRESSION_LIMIT_MESSAGE =
  "Twój plik jest za duży - system próbował go skompresować, lecz jest niemożliwe";

/**
 * Parametry kolejnych iteracji kompresji.
 * Każda kolejna próba jest bardziej agresywna (mniejsza skala rasteryzacji
 * oraz niższa jakość JPEG).
 */
export const COMPRESSION_PROFILES = [
  { scale: 1.5, quality: 0.7 },
  { scale: 1.1, quality: 0.55 },
  { scale: 0.85, quality: 0.4 },
] as const;
