# Diagnostyka Gemini i Cloudinary

## Problemy na Vercel

Jeśli Gemini AI nie działa poprawnie na Vercel (brak odpowiedzi, błędy timeout), użyj endpointów testowych:

### 1. Test Gemini API

```bash
curl https://twoja-domena.vercel.app/api/test-gemini
```

Sprawdza:

- Czy GEMINI_API_KEY jest ustawiony
- Czy API odpowiada
- Czy model działa poprawnie

### 2. Test Cloudinary URL

```bash
curl "https://twoja-domena.vercel.app/api/test-cloudinary?url=URL_DO_PDF"
```

Sprawdza:

- Czy można pobrać plik z Cloudinary
- Czy plik jest prawidłowym PDF
- Rozmiar i nagłówki

## Co zostało naprawione

1. **Lepsze pobieranie plików z Cloudinary**

   - Dodano timeout (30s)
   - Sprawdzanie nagłówków PDF (%PDF)
   - Walidacja Content-Type
   - Lepsze logowanie błędów

2. **Gemini API**

   - Dodano timeout (60s)
   - Sprawdzanie API key przy starcie
   - Lepsze logowanie błędów (quota, network)
   - Walidacja odpowiedzi (safety filters, recitation)

3. **Logowanie**
   - Szczegółowe logi dla debugowania
   - Informacje o rozmiarze plików
   - Stack trace dla błędów

## Typowe problemy

### "Failed to download file"

- Sprawdź czy URL z Cloudinary jest publiczny
- Użyj `/api/test-cloudinary?url=...`

### "Gemini API timeout"

- Plik może być za duży (limit ~20MB dla PDF)
- Zwiększ timeout w Vercel settings

### "Empty response from Gemini"

- Sprawdź logi - może być zablokowane przez safety filters
- Sprawdź czy API key jest poprawny

### "RESOURCE_EXHAUSTED" / 429

- Osiągnięto limit API Gemini
- Poczekaj lub upgrade plan

## Zmienne środowiskowe (Vercel)

Upewnij się że są ustawione:

```env
GEMINI_API_KEY=twoj_klucz_api
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```
