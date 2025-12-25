# Mathify - Dokumentacja Projektu

## Spis treści

1. [Instalacja](#instalacja)
2. [Konfiguracja](#konfiguracja)
3. [Uruchomienie](#uruchomienie)
4. [Struktura projektu](#struktura-projektu)
5. [API Documentation](#api-documentation)
6. [Role użytkowników](#role-użytkowników)
7. [Funkcjonalności](#funkcjonalności)

## Instalacja

### Wymagania

- Node.js 18+
- Docker i Docker Compose
- PostgreSQL 16 (jeśli nie używasz Dockera)

### Kroki instalacji

1. Sklonuj repozytorium:

```bash
git clone <repository-url>
cd mathify
```

2. Zainstaluj zależności:

```bash
npm install
```

3. Skopiuj plik środowiskowy:

```bash
cp .env.example .env
```

4. Edytuj plik `.env` i uzupełnij wymagane zmienne:
   - `DATABASE_URL` - połączenie z bazą danych
   - `NEXTAUTH_SECRET` - sekret dla NextAuth (możesz wygenerować: `openssl rand -base64 32`)
   - `GEMINI_API_KEY` - klucz API Google Gemini
   - `EMAIL_SERVER_*` - konfiguracja serwera email

## Konfiguracja

### Baza danych

#### Z Dockerem (zalecane):

```bash
docker-compose up -d postgres
npm run db:push
```

#### Bez Dockera:

1. Zainstaluj PostgreSQL lokalnie
2. Utwórz bazę danych `mathify`
3. Zaktualizuj `DATABASE_URL` w `.env`
4. Uruchom migracje:

```bash
npm run db:push
```

### Email

Aplikacja używa Nodemailer do wysyłania emaili. Przykładowa konfiguracja dla Gmail:

```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@mathify.app
```

**Uwaga**: Dla Gmail musisz wygenerować "App Password" w ustawieniach konta.

### Gemini AI

1. Uzyskaj klucz API z Google AI Studio: https://makersuite.google.com/app/apikey
2. Dodaj klucz do `.env`:

```env
GEMINI_API_KEY=your-api-key-here
```

### Tryb testowy AI

Jeśli chcesz testować bez faktycznego użycia AI:

```env
AI_TEST_MODE=true
```

## Uruchomienie

### Rozwój lokalny

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:3000

### Z Dockerem (pełne środowisko)

```bash
docker-compose up -d
```

To uruchomi:

- PostgreSQL (port 5432)
- Aplikację Next.js (port 3000)

### Produkcja

```bash
npm run build
npm start
```

## Struktura projektu

```
mathify/
├── prisma/
│   └── schema.prisma          # Schemat bazy danych
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Panel użytkownika
│   │   ├── login/            # Strona logowania
│   │   ├── register/         # Strona rejestracji
│   │   └── page.tsx          # Strona główna
│   ├── components/           # Komponenty React
│   │   └── ui/              # Komponenty UI (Shadcn)
│   ├── lib/                  # Biblioteki pomocnicze
│   │   ├── auth.ts          # Konfiguracja NextAuth
│   │   ├── prisma.ts        # Klient Prisma
│   │   ├── email.ts         # Serwis email
│   │   ├── gemini.ts        # Integracja z Gemini AI
│   │   └── utils.ts         # Funkcje pomocnicze
│   ├── types/               # Definicje typów TypeScript
│   └── middleware.ts        # Middleware Next.js
├── docker-compose.yml        # Konfiguracja Docker
├── Dockerfile               # Dockerfile dla aplikacji
└── package.json             # Zależności projektu
```

## API Documentation

### Autentykacja

#### POST `/api/auth/register`

Rejestracja nowego użytkownika.

**Request Body:**

```json
{
  "firstName": "Jan",
  "lastName": "Kowalski",
  "username": "jkowalski",
  "email": "jan@example.com",
  "password": "SecurePass123!",
  "role": "STUDENT" // lub "TEACHER"
}
```

**Response:**

```json
{
  "message": "Rejestracja pomyślna. Poczekaj na zatwierdzenie konta.",
  "user": {
    "id": "clxx...",
    "username": "jkowalski",
    "email": "jan@example.com",
    "role": "STUDENT"
  }
}
```

#### POST `/api/auth/signin`

Logowanie użytkownika (NextAuth endpoint).

### Użytkownicy (Admin)

#### GET `/api/admin/users`

Lista wszystkich użytkowników (tylko Admin).

#### PUT `/api/admin/users/:id/approve`

Zatwierdzenie konta użytkownika.

#### DELETE `/api/admin/users/:id`

Usunięcie użytkownika (hard delete).

### Kursy

#### GET `/api/courses`

Lista kursów (filtrowana według roli).

#### POST `/api/courses`

Utworzenie nowego kursu (Teacher).

#### GET `/api/courses/:id`

Szczegóły kursu.

#### PUT `/api/courses/:id`

Edycja kursu (Teacher).

#### DELETE `/api/courses/:id`

Usunięcie kursu (Teacher).

### Rozdziały i podrozdziały

#### POST `/api/courses/:courseId/chapters`

Dodanie rozdziału.

#### POST `/api/courses/:courseId/chapters/:chapterId/subchapters`

Dodanie podrozdziału.

### Materiały

#### POST `/api/courses/:courseId/materials`

Dodanie materiału (PDF lub link).

### Prace domowe

#### POST `/api/submissions`

Przesłanie pracy domowej (Student).

**Request:** multipart/form-data

- `file`: plik PDF (max 10MB)
- `subchapterId`: ID podrozdziału

#### GET `/api/submissions/:id`

Szczegóły pracy domowej.

#### PUT `/api/submissions/:id/review`

Weryfikacja pracy przez nauczyciela.

**Request Body:**

```json
{
  "approved": true,
  "generalComment": "Dobra robota!",
  "tasks": [
    {
      "id": "task-1",
      "pointsEarned": 9,
      "maxPoints": 10,
      "teacherComment": "Drobne błędy w ostatnim kroku"
    }
  ]
}
```

## Role użytkowników

### Admin

- Zarządzanie wszystkimi użytkownikami
- Zatwierdzanie nowych kont
- Pełny dostęp do wszystkich kursów
- Zarządzanie systemem

### Teacher (Nauczyciel)

- Tworzenie i zarządzanie kursami
- Dodawanie rozdziałów, podrozdziałów i materiałów
- Zarządzanie widocznością dla uczniów
- Sprawdzanie i weryfikacja prac domowych
- Przeglądanie postępów uczniów

### Student (Uczeń)

- Dostęp do przypisanych kursów
- Przeglądanie materiałów
- Przesyłanie prac domowych
- Przeglądanie swoich wyników i statystyk
- Otrzymywanie powiadomień o sprawdzonych pracach

## Funkcjonalności

### System kursów

Kursy mają hierarchiczną strukturę:

- **Kurs** → **Rozdział** → **Podrozdział** → **Materiały**

Każdy poziom może mieć ustawioną widoczność:

- **Manual**: Nauczyciel ręcznie odblokowuje dla uczniów
- **Date-based**: Automatyczne odblokowywanie według dat
- **Progress-based**: Odblokowywanie po ukończeniu poprzedniego

### Automatyczne sprawdzanie prac

1. Uczeń przesyła plik PDF z rozwiązaniami
2. System wysyła plik do Gemini AI
3. AI analizuje każde zadanie i generuje wyniki:
   - Punkty zdobyte / maksymalne
   - Komentarze do błędów
   - Sugestie poprawek
4. Nauczyciel otrzymuje powiadomienie
5. Nauczyciel weryfikuje i może edytować wyniki
6. Po zatwierdzeniu, uczeń otrzymuje wyniki

### Statystyki i postępy

System generuje wykresy pokazujące:

- Procent poprawności według działów
- Postępy w czasie
- Porównanie z poprzednimi pracami
- Szczegółowe wyniki dla każdego zadania

### Powiadomienia email

System automatycznie wysyła emaile:

- Powitanie po rejestracji
- Aktywacja konta przez admina
- Nowa praca do sprawdzenia (dla nauczyciela)
- Sprawdzona praca (dla ucznia)

## Polecenia NPM

```bash
# Rozwój
npm run dev                # Uruchom serwer deweloperski
npm run build             # Zbuduj aplikację produkcyjną
npm start                 # Uruchom aplikację produkcyjną

# Baza danych
npm run db:generate       # Wygeneruj klienta Prisma
npm run db:push          # Wypchnij schemat do bazy (rozwój)
npm run db:migrate       # Utwórz migrację (produkcja)
npm run db:studio        # Otwórz Prisma Studio

# Inne
npm run lint             # Sprawdź kod (ESLint)
```

## Troubleshooting

### Problem z połączeniem do bazy danych

- Sprawdź czy PostgreSQL działa: `docker ps` lub `pg_isready`
- Zweryfikuj `DATABASE_URL` w `.env`
- Sprawdź czy baza `mathify` została utworzona

### Problem z Gemini AI

- Zweryfikuj klucz API
- Sprawdź czy nie przekroczyłeś limitów API
- Użyj trybu testowego: `AI_TEST_MODE=true`

### Problem z emailem

- Sprawdź dane logowania SMTP
- Dla Gmail użyj App Password, nie zwykłego hasła
- Sprawdź czy port 587 nie jest blokowany przez firewall

### Problem z Docker

- Sprawdź czy Docker Desktop działa
- Wyczyść wolumeny: `docker-compose down -v`
- Przebuduj obrazy: `docker-compose up -d --build`

## Kontakt i wsparcie

Dla pytań i problemów:

- Utwórz Issue na GitHub
- Sprawdź logi: `docker-compose logs app`
- Zobacz dokumentację Prisma: https://www.prisma.io/docs
- Dokumentacja Next.js: https://nextjs.org/docs

## Licencja

Projekt stworzony dla celów edukacyjnych.
