# Mathify - Kontekst Projektu i Przewodnik dla Programistów

Ten dokument stanowi kompleksowe wprowadzenie do projektu Mathify, zaprojektowane specjalnie z myślą o programistach dołączających do projektu i wdrażających nowe funkcjonalności.

## 🎯 1. O projekcie (Czym zajmuje się projekt?)

**Mathify** to w pełni funkcjonalna, webowa platforma edukacyjna stworzona z myślą o usprawnieniu nauczania matematyki. Jej główną innowacją jest wykorzystanie modeli AI (Google Gemini) do automatycznego sprawdzania i analizowania prac domowych (plików PDF) nadsyłanych przez uczniów. 

Platforma wspiera role:
- **Admin**: zarządza systemem i weryfikuje konta.
- **Nauczyciel**: tworzy interaktywne kursy o budowie hierarchicznej (Kurs -> Rozdział -> Temat -> Materiały) i zarządza uczniami. Otrzymuje do ręcznej akceptacji lub korekty wyniki, które wygenerowało AI.
- **Uczeń**: konsumuje materiały, przesyła rozwiązania i śledzi własne postępy (wykresy i statystyki).

## 🛠️ 2. Stos Technologiczny (Tech Stack)

Aplikacja oparta jest na jednym z najnowocześniejszych stosów technologicznych w ekosystemie JavaScript/TypeScript:
- **Framework**: Next.js 15.x (w architekturze App Router)
- **Biblioteka UI**: React 19 + Shadcn/ui + Tailwind CSS
- **Język**: TypeScript
- **Baza danych**: PostgreSQL
- **ORM**: Prisma (wersja 5.x)
- **Autentykacja**: NextAuth.js v5 (auth.js)
- **AI**: Google Generative AI (Gemini Pro)
- **Przechowywanie plików**: Cloudinary
- **Infrastruktura**: Docker & Docker Compose

## 📁 3. Struktura Projektu (Gdzie co jest?)

Katalog główny zawiera folder `src/`, w którym znajduje się cała logika frontendu i backendu.

```text
mathify/
├── prisma/
│   └── schema.prisma         <-- Modele bazy danych, najważniejsze miejsce dla relacji
├── src/
│   ├── app/                  <-- Ścieżki rutingu Next.js (Frontend i Endpointy API)
│   │   ├── api/              <-- Tutaj tworzymy nowe endpointy backendowe (pliki route.ts)
│   │   └── (np. dashboard/)  <-- Strony frontendu (pliki page.tsx, layout.tsx)
│   ├── components/           
│   │   └── ui/               <-- Gotowe, ostylowane komponenty z Shadcn/ui (np. Button, Input)
│   └── lib/                  <-- Połączenia z zewnętrznymi serwisami: 
│       ├── auth.ts           <-- Konfiguracja autoryzacji sesji
│       ├── prisma.ts         <-- Główny klient bazy danych
│       ├── cloudinary.ts     <-- Metody uploadu i generowania linków
│       └── gemini.ts         <-- Metody komunikacji z modelem AI
├── docker-compose.yml        <-- Konfiguracja kontenerów (Postgres + Aplikacja)
└── Dockerfile                <-- Plik budujący produkcyjny obraz Standalone
```

## 🧑‍💻 4. Wytyczne do rozbudowy (Jak dodawać nowe funkcje?)

Jeśli chcesz dodać nowy widok, komponent lub połączyć go z bazą danych, trzymaj się następujących zasad projektowych:

### Tworzenie widoków i ruting (Next.js App Router)
- Wszystkie strony (widoki) twórz wewnątrz `src/app/nazwa-twojej-sciezki/page.tsx`.
- Domyślnie wszystkie komponenty w `src/app` to **Server Components** (renderowane na serwerze). Zawsze kiedy możesz – pobieraj z bazy dane prosto na serwerze (bez ładowania "spinnerów" u klienta).
- Jeśli komponent musi używać stanu (`useState`), efektów (`useEffect`) lub nasłuchiwać kliknięć przycisków, dopisz na samej górze pliku dyrektywę `"use client";`.

### Baza danych i Prisma
1. Kiedy potrzebujesz nowej tabeli lub kolumny, wejdź do pliku `prisma/schema.prisma` i dokonaj tam modyfikacji.
2. Po zmianie wywołaj z poziomu komputera (gdy masz włączoną bazę w dockerze na porcie `5433`):
   `npx prisma db push`
3. Wszystkie zapytania do bazy danych z poziomu kodu wykonuj korzystając z głównej instancji Prismy:
   ```typescript
   import prisma from "@/lib/prisma";
   const users = await prisma.user.findMany();
   ```

### Autoryzacja na nowych podstronach (NextAuth v5)
Jeżeli tworzysz widok lub endpoint, do którego dostęp mogą mieć tylko zalogowani użytkownicy (lub tylko nauczyciele), weryfikuj to za pomocą helpera `auth()` na serwerze:
```typescript
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return new Response("Brak dostępu", { status: 403 });
  }
}
```

### UI i Stylowanie
- Nie pisz czystego CSS. Używaj klas narzędziowych (utility classes) frameworka **Tailwind CSS**.
- Unikaj tworzenia złożonych komponentów UI od zera. Jeśli potrzebujesz nowej tabeli, rozwijanego menu, lub kalendarza, dodaj go z biblioteki **Shadcn/ui** (np. poleceniem `npx shadcn@latest add dialog`). Skrypt wrzuci gotowy kod prosto do folderu `src/components/ui/`.

### Zarządzanie formularzami
Nowe formularze twórz w oparciu o duet **React Hook Form** + **Zod**. Zod służy jako weryfikator bezpieczeństwa schematów zapytań zarówno na frontendzie (czy uczeń nie wpisał za długiego imienia) jak i backendzie. 

### Praca ze środowiskiem deweloperskim (Docker)
Lokalnie pracuj używając uruchomionego kontenera PostgreSQL (na zmienionym porcie 5433 dla bezpieczeństwa Twojego systemu hosta). Aplikację front-endową możesz uruchamiać poleceniem `npm run dev` bezpośrednio z komputera, w celu natychmiastowego przeładowywania zmian w kodzie (Hot Reload).

## 🚀 5. Ważne linki (Pliki konfiguracyjne projektu)
Zawsze pamiętaj o weryfikowaniu zależności w następujących plikach przy dodawaniu nowych zmiennych:
- `.env` – tutaj dodajesz sekrety (konfiguracja bazy, Cloudinary, Gmail, Google AI).
- `docker-compose.yml` – tutaj mapowane są zmienne systemowe na potrzebny kontenera.
- `next.config.js` – plik rządzacy zoptymalizowanym obrazem produkcyjnym (np. dopisuje on obsługę dla `output: "standalone"`).
