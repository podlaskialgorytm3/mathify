# Dokumentacja Bazy Danych i API (Mathify)

Ten dokument zawiera pełny przegląd struktury bazy danych (tabele, relacje, typy kolumn) oraz zestawienie wszystkich dostępnych punktów końcowych (endpointów) w aplikacji.

---

## 💾 1. Struktura Bazy Danych (Prisma Schema)

Główne obiekty i ich relacje oparte na pliku `schema.prisma`. Baza działa na silniku **PostgreSQL**.

### 1.1 Tabela: `User` (Użytkownicy)
Przechowuje dane autoryzacyjne oraz profilowe każdego użytkownika.
- `id` (String) - unikalny identyfikator (cuid)
- `email` (String) - unikalny e-mail
- `username` (String) - unikalna nazwa użytkownika
- `password` (String) - zaszyfrowane hasło
- `firstName` (String) / `lastName` (String) - imię i nazwisko
- `role` (Enum) - rola użytkownika: `ADMIN`, `TEACHER`, `STUDENT`
- `status` (Enum) - status konta: `PENDING`, `ACTIVE`, `INACTIVE`
- `planId` (String, opcjonalny) - przypisany plan subskrypcyjny

### 1.2 Tabela: `Course` (Kursy)
Główny pojemnik na materiały, zarządzany przez nauczyciela.
- `id` (String) - cuid
- `title` (String) - nazwa kursu
- `description` (String, opcjonalny) - opis
- `teacherId` (String) - relacja do `User` (nauczyciela)
- `aiPromptTemplateId` (String, opcjonalny) - szablon AI przypisany do kursu
- `homeworkFileName` (String) - domyślna nazwa pliku z zadaniem

### 1.3 Tabela: `Chapter` i `Subchapter` (Struktura kursu)
Moduły, z których składa się kurs.
**Chapter (Rozdział):**
- `id`, `title`, `description`, `order` (Int), `courseId` (String)
- Pola widoczności: `visibilityType` (MANUAL, DATE_BASED, PROGRESS_BASED), `visibleFromDate`, `visibleUntilDate`

**Subchapter (Temat w rozdziale):**
- Posiada te same pola widoczności co *Chapter*.
- `allowSubmissions` (Boolean) - czy uczeń może wgrywać prace domowe w tym temacie.

### 1.4 Tabela: `Material` (Materiały edukacyjne)
Materiały wrzucane przez nauczyciela do danego tematu (`Subchapter`).
- `id`, `title`, `description`, `order`
- `type` (Enum) - `PDF` lub `LINK`
- `content` (String) - URL do zasobu (np. Cloudinary) lub sam link
- `subchapterId` (String) - przypisanie do tematu

### 1.5 Tabela: `Submission` (Prace domowe uczniów)
Pliki PDF wysyłane przez uczniów jako rozwiązania zadań.
- `id` (String)
- `subchapterId` (String), `studentId` (String)
- `filePath` (String) / `fileName` (String) / `fileSize` (Int) - metadane pliku
- `status` (Enum) - `PENDING`, `AI_CHECKED`, `TEACHER_REVIEWING`, `APPROVED`, `REJECTED`

### 1.6 Tabele dla Sztucznej Inteligencji i Ocen:
- **`AIResult`**: Przechowuje bezpośrednią, surową odpowiedź od Google Gemini dla danego zgłoszenia (`submissionId`, `rawResponse`).
- **`Task`**: Rozbite zadania z pracy domowej po analizie AI (np. Zadanie 1: `pointsEarned`, `maxPoints`, `comment`, `teacherComment`).
- **`SubmissionReview`**: Końcowa ocena nauczyciela po weryfikacji pracy (czy `approved`, komentarz ogólny).
- **`AIPromptTemplate`**: Szablony promptów (instrukcji dla modelu Gemini) zapisane przez nauczycieli.

### 1.7 Pozostałe (Systemowe):
- **`Notification`**: System powiadomień dla użytkowników.
- **`Plan`**: Plany subskrypcyjne (np. limity uczniów dla nauczyciela, cena).
- **`VerificationToken`**: Tokeny resetowania hasła i zmiany e-mail.

---

## 🔌 2. API Endpoints (Ruting Next.js)

Architektura App Router (`src/app/api`). Wszystkie zabezpieczone role-based middlewares (autoryzacją).

### 2.1 Autoryzacja i Profil (`/api/auth/*`, `/api/profile/*`)
- `GET/POST /api/auth/[...nextauth]` - logika logowania NextAuth
- `GET /api/profile` - pobranie danych zalogowanego usera
- `PATCH /api/profile` - aktualizacja imienia, nazwiska lub hasła

### 2.2 Uczeń (Student API - `/api/student/*`)
- `GET /api/student/courses` - pobierz zapisane kursy
- `GET /api/student/courses/[courseId]` - pobierz szczegóły kursu i strukturę
- `GET /api/student/courses/[courseId]/subchapters/[subchapterId]` - szczegóły konkretnego tematu (materiały)
- `GET /api/student/submissions` - historia przesłanych zadań ucznia
- `POST /api/student/submissions` - przesłanie nowej pracy domowej (upload pliku, automatyczne zlecenia analizy do Gemini)
- `DELETE /api/student/submissions` - usunięcie błędnie wysłanego pliku przed oceną
- `GET /api/student/submissions/subchapter/[subchapterId]` - pobranie statusu pracy dla danego tematu

### 2.3 Nauczyciel (Teacher API - `/api/teacher/*`)
- **Kursy i struktura:**
  - `GET/POST /api/teacher/courses` - wylistowanie i tworzenie nowych kursów
  - `GET/PUT/DELETE /api/teacher/courses/[id]` - modyfikacje kursu
  - `POST /api/teacher/courses/[id]/enroll` - ręczne dodawanie uczniów do kursu
  - `POST /api/teacher/courses/[id]/chapters` - tworzenie działów
  - `PUT/DELETE /api/teacher/courses/[id]/chapters/[chapterId]` - edycja działów
  - `POST /api/teacher/chapters/[chapterId]/subchapters` - tworzenie tematów
  - `PUT/DELETE /api/teacher/chapters/[chapterId]/subchapters/[subchapterId]` - edycja tematów
- **Materiały:**
  - `POST /api/teacher/subchapters/[subchapterId]/materials` - dodawanie plików PDF / Linków
  - `PUT/DELETE /api/teacher/materials/[materialId]` - zarządzanie materiałami
  - `POST /api/teacher/materials/bulk-delete` - masowe usuwanie
- **Uczniowie:**
  - `GET /api/teacher/students` - lista wszystkich uczniów nauczyciela
  - `POST /api/teacher/create-student` - stworzenie nowego konta ucznia
  - `POST /api/teacher/reset-student-password` - wymuszenie zmiany hasła ucznia
  - `GET/PUT /api/teacher/students/[studentId]/courses/[courseId]/visibility` - zarządzanie wyjątkami widoczności kursów
- **Prace Domowe i AI:**
  - `GET /api/teacher/submissions` - wszystkie prace oczekujące na ocenę
  - `GET/PUT/DELETE /api/teacher/submissions/[id]` - recenzowanie prac (weryfikacja decyzji podjętych przez Gemini)
  - `GET/POST /api/teacher/ai-prompts` - zarządzanie szablonami promptów AI dla kursów

### 2.4 Administracja i Cloudinary (`/api/admin/*`, `/api/cloudinary/*`)
- Zestaw endpointów do globalnego zarządzania platformą (Admin)
- `GET /api/cloudinary/signed-url` - generowanie zabezpieczonych URL (dla wyświetlania prywatnych PDF)
- `POST /api/upload` - generyczny kontroler przyjmowania plików do chmury Cloudinary (wspiera formaty PDF, obrazy)
