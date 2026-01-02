# Mathify Backend Tests

Kompleksowy zestaw testów jednostkowych i integracyjnych dla backendu aplikacji Mathify.

## 📊 Podsumowanie Testów

- **84+ testów** pokrywających wszystkie główne endpointy API
- Testy dla 5 głównych modułów: Auth, Admin, Teacher, Student, Profile
- Mockowanie wszystkich zależności zewnętrznych
- Narzędzia pomocnicze do tworzenia danych testowych

## 🚀 Szybki Start

### Instalacja zależności

```bash
npm install
```

### Uruchomienie testów

```bash
# Wszystkie testy
npm test

# Testy z pokryciem kodu
npm run test:coverage

# Tryb watch (automatyczne ponowne uruchamianie)
npm run test:watch

# Tryb CI
npm run test:ci
```

## 📁 Struktura Projektu

```
src/__tests__/
├── api/
│   ├── auth/              # Testy autentykacji
│   ├── admin/             # Testy panelu admina
│   ├── teacher/           # Testy panelu nauczyciela
│   ├── student/           # Testy panelu studenta
│   └── profile/           # Testy profilu użytkownika
├── integration/           # Testy integracyjne
└── utils/                 # Narzędzia pomocnicze
```

## 🧪 Co jest testowane?

### Autentykacja

- ✅ Rejestracja użytkowników
- ✅ Logowanie i sesje
- ✅ Weryfikacja JWT
- ✅ Hashowanie haseł

### Panel Administracyjny

- ✅ Zarządzanie użytkownikami
- ✅ Zarządzanie kursami
- ✅ Plany subskrypcyjne
- ✅ Kontrola dostępu

### Panel Nauczyciela

- ✅ Tworzenie kursów
- ✅ Zarządzanie studentami
- ✅ Ocenianie prac
- ✅ Szablony AI
- ✅ Materiały dydaktyczne

### Panel Studenta

- ✅ Przeglądanie kursów
- ✅ Wysyłanie prac
- ✅ Statystyki
- ✅ Widoczność treści

### Profil Użytkownika

- ✅ Aktualizacja danych
- ✅ Zmiana hasła
- ✅ Reset hasła
- ✅ Weryfikacja email

## 📖 Dokumentacja

- [TESTING.md](./TESTING.md) - Pełna dokumentacja testów
- [TEST_COVERAGE.md](./TEST_COVERAGE.md) - Raport pokrycia testów

## 🛠️ Narzędzia

- **Jest** - Framework testowy
- **@testing-library** - Narzędzia testowe
- **jest-mock-extended** - Zaawansowane mockowanie
- **Prisma** - ORM z mockami

## 📝 Przykłady

### Prosty test

```typescript
it("should return user profile", async () => {
  const session = createMockSession("STUDENT", "user-id");
  const request = createMockRequest("/api/profile");

  const response = await handler(request);

  expect(response.status).toBe(200);
});
```

### Test z mockowaniem

```typescript
it("should create a course", async () => {
  prismaMock.course.create.mockResolvedValue(mockCourse);

  const response = await createCourse(request);

  expect(response.status).toBe(201);
});
```

## 🎯 Cel pokrycia kodu

- **Target**: 80% ogólne pokrycie
- **Krytyczne ścieżki**: 100% pokrycie
- **Logika biznesowa**: 90% pokrycie

## 🐛 Debugowanie

```bash
# Pojedynczy test
npm test -- --testNamePattern="nazwa testu"

# Verbose output
npm test -- --verbose

# Konkretny plik
npm test -- src/__tests__/api/auth/register.test.ts
```

## 🤝 Współpraca

1. Dodaj testy dla nowych funkcjonalności
2. Utrzymuj pokrycie kodu > 80%
3. Uruchom testy przed commitem
4. Aktualizuj dokumentację

## 📄 Licencja

Część projektu Mathify.

## 🔗 Linki

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

---

**Utworzono**: Styczeń 2026
**Status**: ✅ Gotowe do użycia
**Pokrycie**: 84+ testów
