# Dokumentacja projektowa: Feature "Dysk danych" (data-disk)

**Projekt:** Mathify
**Status:** Draft do review
**Autor:** Michał Kozak
**Data:** 2026-08-08
**Wersja:** 2 (zaktualizowana o realny schemat bazy i istniejące API)

> Dokument zaktualizowany na podstawie rzeczywistej dokumentacji bazy danych i API Mathify. Nazwy modeli i endpointy odpowiadają temu, co już istnieje w projekcie (`Subchapter`, nie `Topic`; istniejące endpointy `/api/teacher/*`). Sekcja 5 nadal zawiera propozycję **zmian** w istniejącym schemacie — to nie jest opis stanu obecnego, tylko to, co trzeba dodać/zmienić.

---

## 1. Cel i kontekst biznesowy

Nauczyciele w Mathify tworzą kursy o strukturze `Kurs → Rozdział → Temat → Materiały`. Obecnie każdy materiał trzeba dodawać ręcznie od zera, nawet jeśli identyczne treści istnieją już w innym kursie tego samego nauczyciela. Prowadzi to do:
- duplikacji plików na dysku (Cloudinary),
- powtarzalnej, żmudnej pracy nauczyciela,
- braku jednego miejsca, w którym nauczyciel widzi wszystkie swoje materiały.

**Cel feature'a:** umożliwić nauczycielowi **kopiowanie (referencyjne)** istniejących podrozdziałów/materiałów między własnymi kursami oraz dać mu centralny widok — **"Dysk"** — ze wszystkimi plikami, jakie posiada w systemie.

### Mierniki sukcesu
- Spadek liczby duplikatów plików w Cloudinary (mniej re-uploadów tych samych treści).
- Nauczyciel jest w stanie dodać materiał z istniejącego kursu do nowego w < 30 sekund.
- Brak zgłoszeń o "znikających" plikach po usunięciu ich z jednego miejsca, a używanych w innym (obsłużone przez model referencji).

---

## 2. Analiza obecnego stanu (na podstawie realnego schematu)

Rzeczywisty model danych (`prisma/schema.prisma`):

```
User (id, role: ADMIN|TEACHER|STUDENT, ...)
 └─ Course (id, title, teacherId, homeworkFileName, ...)
     └─ Chapter (id, title, order, courseId, visibilityType, ...)
         └─ Subchapter (id, title, allowSubmissions, ..., chapterId)
             ├─ Material (id, title, type: PDF|LINK, content, subchapterId)  ← 1:1 do Subchapter
             └─ Submission (studentId, filePath, fileName, status, ...)      ← prace uczniów, osobna tabela
```

Kluczowe fakty o obecnym stanie:
- **`Material` jest powiązany z dokładnie jednym `Subchapter`** poprzez pole `subchapterId` — relacja **1:N** (`Subchapter -> Material`), nie N:N. To jest dokładnie ograniczenie, które nowy feature musi znieść.
- **`Material` nie ma pola `ownerId`** — właściciela (nauczyciela) trzeba dziś wyliczać przez łańcuch `Material -> Subchapter -> Chapter -> Course -> teacherId`. Dla wydajności i prostoty zapytań na Dysku warto to zdenormalizować (patrz sekcja 5).
- **`Material` nie ma pola rozróżniającego "Kurs" vs "Praca domowa"** — obecnie `type` to `PDF`/`LINK` (format pliku, nie źródło). Do filtrowania na Dysku (Kurs / Praca domowa) potrzebne jest nowe pole (patrz sekcja 5) — **do potwierdzenia z biznesem, patrz sekcja 12**, czy "praca domowa" na Dysku ma w ogóle dotyczyć `Material`, czy może chodzi o inny mechanizm (Course ma już pole `homeworkFileName`, a uczniowie wgrywają prace jako osobny model `Submission`, którym nauczyciel dziś nie zarządza jak plikiem na dysku).
- Pliki fizycznie w Cloudinary, w bazie zapisany URL/identyfikator (`Material.content`, `Submission.filePath`), zarządzanie przez `POST /api/upload` i `GET /api/cloudinary/signed-url`.
- Autoryzacja: `NextAuth v5`, role `ADMIN`, `TEACHER`, `STUDENT`, sprawdzane przez `auth()`; istniejące API jest już podzielone na namespace'y `/api/teacher/*`, `/api/student/*`, `/api/admin/*` — nowe endpointy powinny trzymać się tej konwencji (sekcja 6).

**Zmiana wymagana przez nowy feature:** `Material` musi móc być przypisany do **wielu** `Subchapter` jednocześnie (cytat ze specyfikacji: *"mogą być przypisane do dwóch dowolnych tematów"*), a usunięcie jednego przypisania nie może kasować pliku fizycznie, jeśli istnieją inne referencje — wymaga to zmiany 1:N na N:N (sekcja 5).

---

## 3. Zakres (in / out of scope)

### W zakresie
1. Kopiowanie (referencyjne) podrozdziału wraz z materiałami między kursami tego samego nauczyciela.
2. Kopiowanie (referencyjne) pojedynczego materiału z istniejącego kursu do nowo tworzonego podrozdziału.
3. Strona **"Dysk"** w Dashboardzie nauczyciela: widok kafelkowy/listowy, sortowanie po dacie dodania, filtrowanie (Kurs / Praca domowa).
4. Widok **admina**: wszystkie materiały, filtrowanie po nauczycielu.
5. Reguły uprawnień: usuwanie pliku wyłącznie przez twórcę; usunięcie = usunięcie referencji u wszystkich korzystających.

### Poza zakresem (świadomie pomijamy)
- Podgląd/dostęp do materiałów innego nauczyciela z poziomu kursu, w którym się "gościnnie" naucza (funkcjonalność wspomniana jako *"póki co nie działa"*).
- Kopiowanie materiałów **między różnymi nauczycielami**.
- Wersjonowanie plików / historia zmian materiału.
- Papierkowy kosz (soft-delete z możliwością przywrócenia) — chyba że zespół zdecyduje inaczej (patrz sekcja 12).

---

## 4. Wymagania funkcjonalne (user stories)

### 4.1 Kopiowanie podrozdziału między kursami
**Jako** nauczyciel, **chcę** skopiować cały podrozdział z jednego z moich kursów do nowo tworzonego rozdziału, **aby** nie odtwarzać od zera struktury i materiałów.

Ścieżka UI:
`Moje kursy → [Kurs] → Zarządzaj → [Rozdział] → "+ Podrozdział" → przycisk "Skopiuj podrozdział" (prawy górny róg) → POP-UP: wybór Kursu (tylko własne) → wybór Rozdziału → wybór Podrozdziału → "Skopiuj materiały"`

Efekt: nowy podrozdział w bieżącym kursie, zawierający **referencje** do tych samych materiałów co oryginał.

### 4.2 Kopiowanie pojedynczego materiału
**Jako** nauczyciel, **chcę** dodać do podrozdziału materiał, który już wgrałem w innym kursie, **aby** uniknąć ponownego uploadu tego samego pliku.

Ścieżka UI:
`Moje kursy → [Kurs] → Zarządzaj → [Rozdział] → [Podrozdział] → "+ Materiał" → nowa trzecia opcja "Dodawanie istniejących materiałów" (obok "Dodawanie szybkie" / "Dodawanie normalne") → POP-UP: Kurs → Rozdział → Podrozdział → wybór pliku`

### 4.3 Strona "Dysk"
**Jako** nauczyciel, **chcę** mieć jedno miejsce ze wszystkimi moimi plikami, **aby** łatwo nimi zarządzać.

- Nowa pozycja w menu Dashboardu nauczyciela: **"Dysk"**.
- Widok: przełącznik **Kafelki / Lista**.
- Sortowanie: po dacie dodania (malejąco domyślnie).
- Filtr: **Kurs** vs **Praca domowa** (materiał może pochodzić z jednego lub drugiego źródła).
- Akcje z poziomu Dysku: dodawanie i usuwanie plików.
- Plik może występować pod wieloma tematami (jest to jeden wpis na Dysku, nie duplikat).

### 4.4 Widok Admina
**Jako** admin, **chcę** widzieć wszystkie materiały w systemie i filtrować je po nauczycielu, **aby** mieć nadzór nad zasobami.

- Admin **nie może** usuwać cudzych materiałów — usuwanie zarezerwowane wyłącznie dla twórcy.

### 4.5 Reguły usuwania i referencji
- Kopia = referencja (wskaźnik do tego samego pliku na Cloudinary), **nie** fizyczna duplikacja.
- Usunięcie materiału z poziomu Dysku usuwa go **całkowicie** — znika ze wszystkich podrozdziałów/kursów, w których był użyty (nawet u admina).
- Usunięcie *jednej* referencji/przypisania do tematu (jeśli taka operacja będzie dostępna z poziomu zarządzania kursem, a nie Dysku) nie usuwa pliku, dopóki istnieje choć jedna inna referencja — **do potwierdzenia z biznesem, patrz sekcja 12**.
- Nauczyciel "gość" (korzystający z cudzego kursu) nie zarządza plikami — brak akcji edycji/usuwania (obecnie i tak poza zakresem, bo ta funkcjonalność jeszcze nie działa).

---

## 5. Model danych — propozycja zmian w `schema.prisma`

Punkt wyjścia — obecny model `Material` (uproszczony, wg realnej dokumentacji):

```prisma
model Material {
  id            String   @id @default(cuid())
  title         String
  description   String?
  order         Int
  type          MaterialType   // PDF | LINK
  content       String         // URL do Cloudinary lub link
  subchapterId  String
  subchapter    Subchapter @relation(fields: [subchapterId], references: [id])
}
```

Kluczowa zmiana: przejście z relacji **1:N** (`Subchapter -> Material`, pole `subchapterId` bezpośrednio na `Material`) na **N:N** poprzez tabelę pośrednią `MaterialSubchapter`, żeby jeden plik mógł być przypisany do wielu podrozdziałów bez duplikacji rekordu i bez ponownego uploadu do Cloudinary.

```prisma
enum MaterialSource {
  COURSE     // materiał dodany klasycznie do kursu
  HOMEWORK   // materiał powiązany z pracą domową (do potwierdzenia, patrz sekcja 12)
}

model Material {
  id            String          @id @default(cuid())
  title         String
  description   String?
  type          MaterialType    // PDF | LINK — istniejące pole, bez zmian
  content       String          // URL Cloudinary / link — istniejące pole, bez zmian
  source        MaterialSource  @default(COURSE)   // NOWE — do filtrowania na Dysku
  ownerId       String          // NOWE — denormalizacja: teacherId właściciela (z Course.teacherId w momencie uploadu)
  owner         User            @relation(fields: [ownerId], references: [id])
  createdAt     DateTime        @default(now())    // NOWE, jeśli jeszcze nie istnieje — do sortowania na Dysku
  updatedAt     DateTime        @updatedAt

  subchapters   MaterialSubchapter[]   // ZMIANA: zamiast pojedynczego subchapterId

  @@index([ownerId])
  @@index([source])
}

// NOWY model — tabela łącząca
model MaterialSubchapter {
  id            String     @id @default(cuid())
  materialId    String
  subchapterId  String
  material      Material   @relation(fields: [materialId], references: [id], onDelete: Cascade)
  subchapter    Subchapter @relation(fields: [subchapterId], references: [id], onDelete: Cascade)
  order         Int        @default(0)   // zachowuje dotychczasowe pole `order` z poziomu Material, teraz per-przypisanie
  addedAt       DateTime   @default(now())

  @@unique([materialId, subchapterId])   // ten sam plik nie może być dodany dwa razy do tego samego podrozdziału
  @@index([subchapterId])
}
```

**Uwagi implementacyjne:**
- **Migracja danych jest obowiązkowa i wrażliwa** — obecnie każdy `Material` ma dokładnie jeden `subchapterId`. Skrypt migracyjny musi: (1) dla każdego istniejącego `Material` utworzyć odpowiadający wiersz w `MaterialSubchapter` (`materialId`, `subchapterId` = stare `Material.subchapterId`, `order` = stare `Material.order`), (2) wyliczyć i uzupełnić `ownerId` na podstawie `Material -> Subchapter -> Chapter -> Course -> teacherId`, (3) ustawić `source = COURSE` domyślnie dla wszystkich istniejących rekordów, (4) dopiero potem usunąć starą kolumnę `subchapterId` i `order` z `Material`.
- `onDelete: Cascade` na `MaterialSubchapter` — usunięcie `Material` automatycznie czyści wszystkie referencje (spełnia regułę "usunięcie z Dysku = znika wszędzie", w tym z widoku admina).
- `MaterialType` (istniejący enum `PDF`/`LINK`) zostaje bez zmian — to osobny wymiar (format) od `MaterialSource` (źródło: kurs/praca domowa).
- Rozważ dodanie `courseId` (denormalizacja) na `MaterialSubchapter` lub wyliczanie go w zapytaniu przez `Subchapter -> Chapter -> Course`, w zależności od wolumenu danych — wpływa na wydajność filtrowania "po kursie" na Dysku.
- `Submission` (prace uczniów) **pozostaje osobnym modelem** i nie jest częścią tej zmiany — patrz otwarte pytanie w sekcji 12 dot. filtra "Praca domowa" na Dysku.

---

## 6. Endpointy API (`src/app/api/...`)

Nowe endpointy trzymają się istniejącej konwencji namespace'ów (`/api/teacher/*`, `/api/admin/*`). Tam, gdzie to możliwe, **rozszerzamy** istniejące endpointy zamiast tworzyć równoległe.

### Nowe endpointy

| Metoda | Ścieżka | Opis | Autoryzacja |
|---|---|---|---|
| `GET` | `/api/teacher/disk` | Lista materiałów zalogowanego nauczyciela, zgrupowana po `materialId` (query: `source`, `sort`, `view`) | `TEACHER` |
| `GET` | `/api/admin/disk` | Lista wszystkich materiałów w systemie (query: `teacherId` do filtrowania) | `ADMIN` |
| `POST` | `/api/teacher/subchapters/[subchapterId]/materials/link` | Podpięcie istniejącego materiału (referencja) do podrozdziału | `TEACHER` (owner-only) |
| `POST` | `/api/teacher/subchapters/[subchapterId]/copy-from/[sourceSubchapterId]` | Skopiowanie (referencje) wszystkich materiałów z jednego podrozdziału do drugiego | `TEACHER` (owner-only) |

### Istniejące endpointy — wymagana modyfikacja zachowania

| Metoda | Ścieżka | Zmiana wynikająca z feature'a |
|---|---|---|
| `POST /api/teacher/subchapters/[subchapterId]/materials` | Dodawanie materiału | Bez zmian w kontrakcie — nadal tworzy **nowy** `Material` (klasyczny upload). Trzeba dopisać ustawianie `ownerId` i `source` przy tworzeniu rekordu. |
| `PUT/DELETE /api/teacher/materials/[materialId]` | Zarządzanie materiałem | `DELETE` musi teraz: (1) zweryfikować `ownerId === session.user.id` zamiast pośredniego sprawdzenia przez `subchapterId`, (2) skasować plik z Cloudinary, (3) polegać na `onDelete: Cascade` w `MaterialSubchapter`, żeby materiał zniknął ze **wszystkich** podrozdziałów, w których był referencjonowany (w tym u innych nauczycieli korzystających z kursu — jeśli taki scenariusz w ogóle występuje, patrz sekcja 4.5). |
| `POST /api/teacher/materials/bulk-delete` | Masowe usuwanie | Ta sama logika kaskadowa co wyżej, dla wielu ID naraz. |
| `GET /api/teacher/courses/[id]` | Szczegóły kursu i struktura | Zweryfikować, czy zwracana struktura (rozdziały/podrozdziały) wystarcza do zasilenia kaskadowego selecta w dialogu kopiowania (Kurs → Rozdział → Podrozdział), czy potrzebny osobny lżejszy endpoint tylko ze strukturą (bez pełnej treści materiałów) dla wydajności POP-UP-a. |

Walidacja requestów: `Zod` (zgodnie z konwencją projektu), np.:

```typescript
const copyMaterialsSchema = z.object({
  sourceSubchapterId: z.string().cuid(),
  targetSubchapterId: z.string().cuid(),
});

const linkMaterialSchema = z.object({
  materialId: z.string().cuid(),
});
```

Każdy endpoint musi weryfikować `auth()` **oraz** że zasób (kurs/rozdział/podrozdział/materiał) należy do zalogowanego nauczyciela (`ownerId` / `Course.teacherId`) — inaczej `403`. Wzorzec zgodny z tym, co już stosowane jest w projekcie (patrz przykład `auth()` w dokumentacji wdrożeniowej Mathify).

---

## 7. Architektura UI

### Nowe strony
- `src/app/dashboard/disk/page.tsx` — strona "Dysk" (Server Component: pobiera dane z bazy bezpośrednio, bez fetch po stronie klienta).
- Komponent listy/kafelków jako Client Component (`"use client"`) — potrzebuje stanu na przełącznik widoku i filtr.

### Nowe komponenty (proponowane)
```
src/components/disk/
├── disk-view-toggle.tsx      (Kafelki / Lista — use client)
├── disk-filter.tsx           (Kurs / Praca domowa — use client)
├── disk-grid.tsx
├── disk-list.tsx
├── material-card.tsx
└── copy-material-dialog.tsx  (Shadcn Dialog + Combobox: Kurs → Rozdział → Podrozdział → Plik)

src/components/course-management/
└── copy-subchapter-dialog.tsx (Shadcn Dialog: Kurs → Rozdział → Podrozdział → "Skopiuj materiały")
```

- Wykorzystaj `npx shadcn@latest add dialog combobox` jeśli tych komponentów jeszcze nie ma w `src/components/ui/`.
- Formularze wyboru (kaskadowe dropdowny Kurs→Rozdział→Podrozdział) oparte o `React Hook Form` zgodnie z konwencją projektu.
- Menu Dashboardu nauczyciela: dodać pozycję **"Dysk"** (ikona np. `HardDrive` z `lucide-react`).

---

## 8. Logika biznesowa — kluczowe reguły

1. **Kopia = referencja.** Operacja kopiowania tworzy wyłącznie nowy wiersz w `MaterialSubchapter`, nigdy nowy plik w Cloudinary ani nowy rekord `Material`.
2. **Unikalność na Dysku.** Materiał podpięty pod kilka podrozdziałów pojawia się na Dysku **raz** (grupowanie po `materialId`, nie po `MaterialSubchapter.id`).
3. **Usuwanie jest właścicielskie i kaskadowe.** Tylko `ownerId === session.user.id` może usunąć `Material`. Usunięcie kasuje plik z Cloudinary (`lib/cloudinary.ts`) i kaskadowo wszystkie `MaterialSubchapter` — plik znika ze wszystkich kursów/podrozdziałów, łącznie z widokiem admina.
4. **Nauczyciel może kopiować tylko własne zasoby.** Wybór kursu/rozdziału/podrozdziału w POP-UP zawsze filtrowany po `ownerId`.
5. **Admin nie usuwa cudzych materiałów** — widok admina jest tylko do odczytu + filtrowania.
6. **Filtr źródła (`source`)** — to nowe pole (nie istnieje dziś w `Material`), ustawiane raz przy tworzeniu materiału (`COURSE` lub `HOMEWORK`), niezmienne później. Wymaga potwierdzenia zakresu — patrz sekcja 12, bo w obecnym schemacie prace domowe uczniów to osobny model `Submission`, którym nauczyciel dotąd nie zarządzał jak plikiem na Dysku.

---

## 9. Plan implementacji krok po kroku

1. **Baza danych**
   - [ ] Dodać model `MaterialSubchapter`, enum `MaterialSource` i zmodyfikować `Material` w `schema.prisma` (dodać `source`, `ownerId`, `createdAt`; usunąć `subchapterId`, `order`).
   - [ ] Napisać skrypt migracyjny przenoszący istniejące relacje `Material.subchapterId` do `MaterialSubchapter` + wyliczający `ownerId` z `Course.teacherId`.
   - [ ] Rozstrzygnąć pytanie z sekcji 12 dot. `Submission` vs `Material` **przed** pisaniem migracji, bo wpływa na finalny kształt `source`.
   - [ ] `npx prisma db push` na środowisku deweloperskim (Docker, port `5433`).
2. **Backend / API**
   - [ ] Endpointy z sekcji 6, z walidacją Zod i sprawdzaniem własności zasobu.
   - [ ] Logika usuwania z Cloudinary + kaskadowe czyszczenie referencji.
3. **UI — Dysk**
   - [ ] Strona `disk/page.tsx` + pozycja w menu.
   - [ ] Widok kafelki/lista + filtr Kurs/Praca domowa + sortowanie po dacie.
   - [ ] Widok admina z filtrem po nauczycielu.
4. **UI — Kopiowanie**
   - [ ] Dialog kopiowania podrozdziału (kaskadowy wybór Kurs→Rozdział→Podrozdział).
   - [ ] Trzecia opcja przy "+ Materiał": "Dodawanie istniejących materiałów".
5. **Uprawnienia**
   - [ ] Middleware/`auth()` guards na wszystkich nowych endpointach.
   - [ ] Testy manualne: próba dostępu do cudzych zasobów (oczekiwane `403`).
6. **QA i wdrożenie**
   - [ ] Testy z sekcji 10.
   - [ ] Code review + merge.
   - [ ] Weryfikacja na środowisku produkcyjnym po deployu (smoke test).

---

## 10. Testowanie

- **Jednostkowe:** logika filtrowania/grupowania materiałów na Dysku (deduplikacja po `materialId`).
- **Integracyjne (API):**
  - kopiowanie podrozdziału tworzy poprawną liczbę referencji, bez duplikacji plików w Cloudinary,
  - próba skopiowania cudzego kursu → `403`,
  - usunięcie materiału usuwa go ze wszystkich powiązanych tematów i z widoku admina.
- **E2E (np. Playwright):** pełna ścieżka UI kopiowania podrozdziału i pojedynczego materiału, przełączanie widoku Dysku, filtrowanie.
- **Przypadki brzegowe:**
  - kopiowanie podrozdziału bez żadnych materiałów,
  - materiał podpięty pod 2+ tematy — usunięcie z jednego miejsca a widoczność w innych,
  - równoczesne dodanie tej samej referencji dwa razy (obsłużone przez `@@unique` w `MaterialTopic`).

---

## 11. Bezpieczeństwo i uprawnienia

- Wszystkie endpointy chronione przez `auth()`, rola `TEACHER`/`ADMIN`.
- Każda operacja na zasobie (kurs/rozdział/temat/materiał) musi weryfikować `ownerId` po stronie serwera — nie polegać wyłącznie na ukryciu opcji w UI.
- Usuwanie plików z Cloudinary powinno być idempotentne (obsłużyć przypadek, gdy plik już nie istnieje po stronie Cloudinary, a rekord w bazie tak).

---

## 12. Otwarte pytania i ryzyka

- ❓ **Najważniejsze do wyjaśnienia:** czym dokładnie są pliki filtrowane jako "Praca domowa" na Dysku? W realnym schemacie prace uczniów to osobny model `Submission` (przypisany do `studentId`, zarządzany przez ucznia + weryfikowany przez `SubmissionReview`), a nie `Material`. Możliwe interpretacje do potwierdzenia z biznesem:
  a) Chodzi o pliki-zadania, które **nauczyciel** dodaje do podrozdziału z `allowSubmissions = true` (czyli nadal `Material`, tylko oznaczony `source = HOMEWORK`) — wtedy propozycja z sekcji 5 jest wystarczająca.
  b) Chodzi o faktyczne prace uczniów (`Submission`) widoczne z poziomu Dysku nauczyciela — wtedy Dysk musi agregować dane z **dwóch różnych modeli** (`Material` + `Submission`), co znacząco zwiększa złożoność (inne zasady usuwania, inny właściciel — `studentId` a nie nauczyciel).
  Rekomendacja: potwierdzić z product ownerem przed startem prac nad filtrem, bo wpływa na architekturę zapytań w `GET /api/teacher/disk`.
- ❓ Czy usunięcie **jednej referencji** (odpięcie materiału od konkretnego podrozdziału, bez kasowania samego pliku) ma być w ogóle dostępne, czy jedyną drogą usuwania jest "usuń z Dysku" (co kasuje wszędzie)? Specyfikacja sugeruje to drugie, ale warto potwierdzić z biznesem.
- ❓ Czy potrzebny jest limit liczby podrozdziałów, do których można podpiąć jeden materiał?
- ⚠️ **Ryzyko migracji danych:** zmiana z relacji 1:N na N:N (`Material.subchapterId` → `MaterialSubchapter`) na produkcyjnej bazie wymaga starannego skryptu migracyjnego, wyliczenia `ownerId` dla wszystkich istniejących rekordów i okna serwisowego.
- ⚠️ **Ryzyko wydajnościowe:** filtrowanie Dysku po kursie przy N:N może wymagać dodatkowego indeksu lub denormalizacji (`courseId` na `MaterialSubchapter`) — do zweryfikowania przy realnych wolumenach danych.
- ⚠️ **Ryzyko wsteczne:** `POST /api/teacher/subchapters/[subchapterId]/materials` i `PUT/DELETE /api/teacher/materials/[materialId]` są już używane przez istniejący frontend — zmiana kontraktu/zachowania (kaskadowe usuwanie) musi zostać zweryfikowana pod kątem miejsc, które dziś z nich korzystają, żeby nie złamać istniejącego UI.

---

## 13. Definicja ukończenia (Definition of Done)

- [ ] Migracja Prisma zaaplikowana bez utraty istniejących danych.
- [ ] Wszystkie endpointy z sekcji 6 zaimplementowane i pokryte testami.
- [ ] Strona "Dysk" dostępna z menu nauczyciela, działa filtrowanie i sortowanie.
- [ ] Kopiowanie podrozdziału i pojedynczego materiału działa zgodnie z opisem w sekcji 4.
- [ ] Reguły uprawnień (owner-only delete, brak dostępu do cudzych zasobów) zweryfikowane testami.
- [ ] Widok admina z filtrem po nauczycielu gotowy.
- [ ] Code review zaakceptowany, dokument zaktualizowany o ewentualne zmiany wprowadzone w trakcie implementacji.
