# Testy Backendu - Mathify

## Przegląd

Projekt zawiera kompleksowy zestaw testów jednostkowych i integracyjnych dla backendu aplikacji Mathify. Testy pokrywają wszystkie główne endpointy API oraz funkcjonalności systemu.

## Struktura Testów

```
src/__tests__/
├── api/
│   ├── auth/                    # Testy autentykacji i rejestracji
│   │   ├── auth.test.ts
│   │   └── register.test.ts
│   ├── admin/                   # Testy endpointów administracyjnych
│   │   ├── users.test.ts
│   │   ├── courses.test.ts
│   │   └── plans.test.ts
│   ├── teacher/                 # Testy endpointów nauczyciela
│   │   ├── courses.test.ts
│   │   ├── submissions.test.ts
│   │   ├── ai-prompts.test.ts
│   │   └── create-student.test.ts
│   ├── student/                 # Testy endpointów studenta
│   │   ├── courses.test.ts
│   │   └── submissions.test.ts
│   └── profile/                 # Testy profilu użytkownika
│       ├── profile.test.ts
│       └── password-reset.test.ts
└── utils/                       # Narzędzia pomocnicze do testów
    ├── test-helpers.ts
    ├── prisma-mock.ts
    ├── gemini-mock.ts
    ├── email-mock.ts
    └── integration-helpers.ts
```

## Instalacja

Zainstaluj zależności testowe:

```bash
npm install
```

Dodatkowe pakiety testowe już są skonfigurowane w `package.json`:

- `jest` - framework testowy
- `@testing-library/jest-dom` - matchers dla DOM
- `@testing-library/react` - testowanie komponentów React
- `jest-mock-extended` - zaawansowane mockowanie
- `@types/jest` - typy TypeScript dla Jest

## Uruchamianie Testów

### Wszystkie testy

```bash
npm test
```

### Testy w trybie watch (automatyczne ponowne uruchamianie)

```bash
npm run test:watch
```

### Testy z pokryciem kodu

```bash
npm run test:coverage
```

### Testy w środowisku CI

```bash
npm run test:ci
```

### Pojedynczy plik testowy

```bash
npm test -- src/__tests__/api/auth/register.test.ts
```

### Testy z określonym wzorcem

```bash
npm test -- --testNamePattern="should create a new course"
```

## Zakres Testów

### 1. Autentykacja (Auth API)

- ✅ Rejestracja nowych użytkowników
- ✅ Walidacja danych wejściowych
- ✅ Sprawdzanie unikalności email/username
- ✅ Hashowanie haseł
- ✅ Uwierzytelnianie użytkowników
- ✅ Zarządzanie sesjami JWT

### 2. Panel Administracyjny (Admin API)

- ✅ Zarządzanie użytkownikami (CRUD)
- ✅ Filtrowanie użytkowników po roli i statusie
- ✅ Zarządzanie kursami
- ✅ Tworzenie i edycja planów subskrypcyjnych
- ✅ Przypisywanie planów nauczycielom
- ✅ Kontrola dostępu (tylko ADMIN)

### 3. Panel Nauczyciela (Teacher API)

- ✅ Zarządzanie własnymi kursami
- ✅ Przeglądanie i ocenianie prac studentów
- ✅ Zarządzanie szablonami promptów AI
- ✅ Tworzenie kont studentów
- ✅ Resetowanie haseł studentów
- ✅ Zarządzanie widocznością treści
- ✅ Dodawanie materiałów do podrozdziałów

### 4. Panel Studenta (Student API)

- ✅ Przeglądanie przypisanych kursów
- ✅ Dostęp tylko do widocznych rozdziałów
- ✅ Wysyłanie prac domowych
- ✅ Przeglądanie własnych zgłoszeń
- ✅ Usuwanie nieprzejrzanych prac
- ✅ Statystyki punktów i ocen

### 5. Profil Użytkownika (Profile API)

- ✅ Pobieranie danych profilu
- ✅ Aktualizacja profilu
- ✅ Zmiana hasła
- ✅ Żądanie resetu hasła
- ✅ Reset hasła z tokenem
- ✅ Walidacja tokenów

## Narzędzia Pomocnicze

### Test Helpers (`test-helpers.ts`)

```typescript
// Tworzenie mock session
const session = createMockSession("TEACHER", "teacher-id");

// Tworzenie mock request
const request = createMockRequest("/api/courses", {
  method: "POST",
  body: { title: "New Course" },
});

// Mock danych Prisma
const user = mockPrismaUser({ role: "STUDENT" });
const course = mockPrismaCourse({ teacherId: "teacher-id" });
```

### Prisma Mock (`prisma-mock.ts`)

Mockowanie zapytań do bazy danych:

```typescript
import { prismaMock } from "@/__tests__/utils/prisma-mock";

prismaMock.user.findUnique.mockResolvedValue(mockUser);
```

### Gemini Mock (`gemini-mock.ts`)

Mockowanie odpowiedzi AI:

```typescript
import { MockGoogleGenerativeAI } from "@/__tests__/utils/gemini-mock";
```

### Email Mock (`email-mock.ts`)

Mockowanie wysyłania emaili:

```typescript
import { mockEmailService } from "@/__tests__/utils/email-mock";
```

## Najlepsze Praktyki

### 1. Izolacja Testów

Każdy test powinien być niezależny i nie wpływać na inne testy:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

### 2. Testowanie Autoryzacji

Zawsze testuj kontrolę dostępu:

```typescript
it("should deny access to non-admin users", async () => {
  const teacherSession = createMockSession("TEACHER");
  (auth as jest.Mock).mockResolvedValue(teacherSession);

  const response = await handler(request);
  expect(response.status).toBe(403);
});
```

### 3. Testowanie Walidacji

Sprawdzaj wszystkie wymagane pola:

```typescript
it("should require all necessary fields", async () => {
  const request = createMockRequest("/api/courses", {
    method: "POST",
    body: {
      /* brak wymaganych pól */
    },
  });

  const response = await handler(request);
  expect(response.status).toBe(400);
});
```

### 4. Testowanie Edge Cases

```typescript
it("should handle database errors gracefully", async () => {
  prismaMock.user.create.mockRejectedValue(new Error("DB Error"));

  const response = await handler(request);
  expect(response.status).toBe(500);
});
```

## Pokrycie Kodu

Cel: **Minimum 80% pokrycia kodu**

Sprawdź aktuelle pokrycie:

```bash
npm run test:coverage
```

Raport pokrycia zostanie wygenerowany w katalogu `coverage/`.

## Debugowanie Testów

### Uruchomienie pojedynczego testu

```bash
npm test -- --testNamePattern="nazwa testu"
```

### Verbose output

```bash
npm test -- --verbose
```

### Debugowanie w VS Code

Dodaj do `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Testy Integracyjne

Dla testów integracyjnych użyj `integration-helpers.ts`:

```typescript
import {
  setupTestDatabase,
  cleanupTestDatabase,
} from "@/__tests__/utils/integration-helpers";

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await cleanupTestDatabase();
});
```

## CI/CD

Testy są skonfigurowane do uruchamiania w pipeline CI/CD:

```bash
npm run test:ci
```

Flags CI:

- `--ci` - optymalizacja dla środowisk CI
- `--coverage` - generowanie raportu pokrycia
- `--maxWorkers=2` - ograniczenie użycia zasobów

## Troubleshooting

### Problem: Testy się zawieszają

**Rozwiązanie:** Upewnij się, że wszystkie połączenia są zamykane:

```typescript
afterAll(async () => {
  await prisma.$disconnect();
});
```

### Problem: Mock nie działa

**Rozwiązanie:** Sprawdź kolejność importów i mocków:

```typescript
// Mock musi być przed importem
jest.mock("@/lib/prisma");
import { prisma } from "@/lib/prisma";
```

### Problem: Błędy TypeScript w testach

**Rozwiązanie:** Dodaj typy:

```bash
npm install --save-dev @types/jest
```

## Dodawanie Nowych Testów

1. Utwórz plik testowy w odpowiednim katalogu
2. Użyj konwencji nazewnictwa: `*.test.ts`
3. Importuj niezbędne helpery
4. Napisz testy używając `describe` i `it`
5. Mockuj zależności
6. Uruchom testy: `npm test`

Przykład:

```typescript
import { handler } from "@/app/api/new-endpoint/route";
import {
  createMockRequest,
  createMockSession,
} from "@/__tests__/utils/test-helpers";

describe("New Endpoint", () => {
  it("should work correctly", async () => {
    // Arrange
    const session = createMockSession("TEACHER");
    const request = createMockRequest("/api/new-endpoint");

    // Act
    const response = await handler(request);

    // Assert
    expect(response.status).toBe(200);
  });
});
```

## Kontakt i Wsparcie

W przypadku pytań dotyczących testów:

- Sprawdź dokumentację Jest: https://jestjs.io/
- Przejrzyj istniejące testy jako przykłady
- Sprawdź pliki pomocnicze w `src/__tests__/utils/`

## Licencja

Ten projekt testowy jest częścią aplikacji Mathify.
