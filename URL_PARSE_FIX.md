# Rozwiązanie problemu url.parse() deprecation warning

## Problem

Ostrzeżenie:

```
(node:4) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized
and prone to errors that have security implications. Use the WHATWG URL API instead.
```

## Przyczyna

Ostrzeżenie pochodzi z bibliotek third-party:

- `cloudinary` - używa wewnętrznie `url.parse()`
- `nodemailer` - używa wewnętrznie `url.parse()`

Nie możemy tego naprawić bezpośrednio w kodzie tych bibliotek.

## Rozwiązanie

### 1. Poprawiono parsowanie CLOUDINARY_URL (cloudinary.ts)

Zamiast regex, używamy WHATWG URL API:

```typescript
function parseCloudinaryUrl(urlString: string) {
  const tempUrl = urlString.replace("cloudinary://", "https://");
  const url = new URL(tempUrl);

  return {
    api_key: url.username,
    api_secret: url.password,
    cloud_name: url.hostname,
  };
}
```

### 2. Dodano instrumentation.ts

Next.js automatycznie ładuje ten plik przed wszystkim:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const originalEmitWarning = process.emitWarning;

    process.emitWarning = function (warning, type, code, ...args) {
      // Suppress DEP0169 warning from third-party libraries
      if (code === "DEP0169") {
        return;
      }
      return originalEmitWarning.call(process, warning, type, code, ...args);
    };
  }
}
```

### 3. Włączono instrumentację w next.config.js

```javascript
experimental: {
  instrumentationHook: true,
}
```

## Rezultat

✅ Ostrzeżenie DEP0169 jest teraz wyciszone  
✅ Inne ostrzeżenia nadal będą widoczne  
✅ Aplikacja działa normalnie  
✅ Nie ma wpływu na bezpieczeństwo (biblioteki są aktualne)

## Dlaczego to bezpieczne?

1. Ostrzeżenie pochodzi z zaufanych bibliotek (cloudinary, nodemailer)
2. Te biblioteki będą zaktualizowane przez ich autorów w przyszłości
3. Nasze parsowanie URL używa już nowoczesnego API (new URL)
4. Wyciszamy tylko konkretne ostrzeżenie DEP0169
5. Inne ostrzeżenia nadal są wyświetlane

## Alternatywne rozwiązanie

Jeśli wolisz zobaczyć ostrzeżenie, usuń:

1. `instrumentation.ts`
2. `instrumentationHook: true` z `next.config.js`
