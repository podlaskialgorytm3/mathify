# Mathify

Aplikacja do śledzenia rozwoju matematycznego uczniów z automatycznym sprawdzaniem prac przez AI.

## 🚀 Quick Start

### Z Dockerem (Zalecane)

```bash
# 1. Sklonuj repozytorium
git clone <repository-url>
cd mathify

# 2. Skopiuj i edytuj zmienne środowiskowe
cp .env.example .env
# Edytuj .env i uzupełnij GEMINI_API_KEY i dane email

# 3. Uruchom wszystko
docker-compose up -d

# 4. Otwórz przeglądarkę
# http://localhost:3000
```

### Bez Dockera

```bash
# 1. Sklonuj repozytorium
git clone <repository-url>
cd mathify

# 2. Zainstaluj zależności
npm install

# 3. Skonfiguruj .env
cp .env.example .env
# Edytuj .env i uzupełnij wszystkie dane

# 4. Uruchom PostgreSQL lokalnie (jeśli nie masz Dockera)
# Utwórz bazę danych 'mathify'

# 5. Przygotuj bazę danych
npm run db:push

# 6. Uruchom aplikację
npm run dev

# 7. Otwórz przeglądarkę
# http://localhost:3000
```

## 📋 Wymagania

- Node.js 18+
- PostgreSQL 16+
- Docker & Docker Compose (opcjonalnie, ale zalecane)
- Google Gemini API Key
- Serwer SMTP (np. Gmail)

## ✨ Główne funkcje

- ✅ System logowania i rejestracji z zatwierdzaniem przez admina
- 👥 Trzy role: Administrator, Nauczyciel, Uczeń
- 📚 Hierarchiczne kursy (Kurs → Rozdział → Podrozdział → Materiały)
- 🤖 Automatyczne sprawdzanie prac przez Gemini AI
- ✏️ Weryfikacja i edycja wyników przez nauczyciela
- 📊 Statystyki i wykresy postępów ucznia
- 📧 Powiadomienia email
- 🔒 Bezpieczna autentykacja (NextAuth.js)
- 🎨 Nowoczesny interfejs (Shadcn/ui + Tailwind)

## 🏗️ Technologie

- **Frontend & Backend**: Next.js 15 (App Router)
- **Baza danych**: PostgreSQL + Prisma ORM
- **Autentykacja**: NextAuth.js v5
- **UI**: Shadcn/ui + Tailwind CSS
- **AI**: Google Gemini Pro
- **Email**: Nodemailer
- **Charts**: Chart.js
- **Containerization**: Docker

## 📖 Dokumentacja

Pełna dokumentacja znajduje się w pliku [DOCUMENTATION.md](./DOCUMENTATION.md), zawierająca:

- Szczegółową instrukcję instalacji
- Opis API endpoints
- Konfigurację środowiska
- Troubleshooting
- Przykłady użycia

Dokumentacja Docker: [DOCKER.md](./DOCKER.md)

## 📁 Struktura projektu

```
mathify/
├── src/
│   ├── app/              # Next.js pages i API routes
│   ├── components/       # Komponenty React
│   ├── lib/             # Biblioteki (auth, prisma, email, AI)
│   └── types/           # TypeScript types
├── prisma/
│   └── schema.prisma    # Schemat bazy danych
├── docker-compose.yml   # Docker configuration
└── .env.example         # Przykładowa konfiguracja
```

## 🔑 Zmienne środowiskowe

Kluczowe zmienne w `.env`:

```env
# Database
DATABASE_URL="postgresql://mathify:mathify_password@localhost:5432/mathify"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Email (przykład dla Gmail)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"

# Testing
AI_TEST_MODE="false"
```

## 🎯 Pierwsze kroki

1. **Zarejestruj konto** jako Nauczyciel lub Uczeń
2. **Admin** zatwierdza konto (pierwszy użytkownik może być utworzony ręcznie w bazie jako ADMIN)
3. **Nauczyciel** tworzy kurs, rozdziały i materiały
4. **Nauczyciel** dodaje uczniów do kursu
5. **Uczeń** przegląda materiały i przesyła prace domowe
6. **AI** automatycznie sprawdza pracę
7. **Nauczyciel** weryfikuje i zatwierdza wyniki
8. **Uczeń** otrzymuje feedback i może śledzić postępy

## 🛠️ Development

```bash
# Uruchom serwer deweloperski
npm run dev

# Przebuduj klienta Prisma
npm run db:generate

# Otwórz Prisma Studio (GUI dla bazy danych)
npm run db:studio

# Sprawdź linting
npm run lint
```

## 🐳 Docker Commands

```bash
# Uruchom wszystkie serwisy
docker-compose up -d

# Zatrzymaj serwisy
docker-compose down

# Zobacz logi
docker-compose logs -f app

# Przebuduj i uruchom
docker-compose up -d --build
```

## 🧪 Tryb testowy

Aby testować bez faktycznego użycia Gemini API, ustaw w `.env`:

```env
AI_TEST_MODE=true
```

System będzie używał zaślepkowych danych AI.

## 📝 Licencja

Projekt stworzony dla celów edukacyjnych.

## 🤝 Wkład

1. Fork projektu
2. Utwórz branch (`git checkout -b feature/AmazingFeature`)
3. Commit zmiany (`git commit -m 'Add some AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 🐛 Zgłaszanie problemów

Znalazłeś bug? Utwórz Issue na GitHub z:

- Opisem problemu
- Krokami do reprodukcji
- Oczekiwanym zachowaniem
- Logami (jeśli dostępne)

## 📞 Kontakt

W razie pytań sprawdź [DOCUMENTATION.md](./DOCUMENTATION.md) lub utwórz Issue.

---

**Mathify** - Nowoczesne podejście do nauczania matematyki 🎓📐
