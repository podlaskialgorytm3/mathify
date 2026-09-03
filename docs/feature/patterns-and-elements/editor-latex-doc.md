# Dokumentacja projektowa: Zarządzanie Szablonami i Elementami (latex-templates-elements)

**Projekt:** Mathify
**Feature:** rozszerzenie `latex-editor` o szablony i elementy
**Status:** Draft do review
**Data:** 2026-08-31

> Ten dokument **zakłada, że podstawowa funkcjonalność edytora LaTeX ("Stwórz własne", publikacja materiału, edycja istniejącego materiału LaTeX-owego) jest już zaimplementowana** — zgodnie z dokumentem `latex-editor-dokumentacja-agentowa.md`, fazy 1-4. Nie opisuję tu tamtej części ponownie. Ten dokument obejmuje **wyłącznie** Fazę 5 stamtąd: "Zarządzanie szablonami" i "Zarządzanie elementami".

---

## 1. Cel i kontekst biznesowy

Nauczyciel piszący materiały w LaTeX-u powtarza dużo tego samego kodu — ten sam nagłówek dokumentu za każdym razem, te same powtarzalne fragmenty (np. kratka do liczb, ramka na zadanie). Cel:

- **Szablony** — gotowy punkt startowy dla **całego** nowego dokumentu (kopiowany raz, na start).
- **Elementy** — gotowe fragmenty kodu, wstawiane **wielokrotnie, w dowolnym miejscu** dokumentu.

### Mierniki sukcesu

- Nauczyciel z minimum jednym szablonem zaczyna nowy materiał bez pisania boilerplate'u LaTeX od zera.
- Wstawienie elementu do dokumentu zajmuje jedno kliknięcie, niezależnie ile razy jest używany w tym samym materiale.

---

## 2. Analiza obecnego stanu

Co **już istnieje** (zakładany punkt wyjścia):

- Model `LatexDocument` (`id`, `title`, `sourceCode`, `ownerId`, `materialId`, `templateId`, `createdAt`, `updatedAt`).
- Edytor pełnoekranowy (POP-UP, split-screen: kod / podgląd PDF) — komponent, który tu **reużywamy**, nie duplikujemy.
- Endpointy `POST/GET/PUT /api/teacher/latex-documents[/id]`, `POST .../compile`, `POST .../publish`.
- Przycisk "Edycja i Kompilacja Materiałów" w sidebarze Dashboardu, obecnie **prowadzący od razu** do dialogu nazwy pliku i edytora.

**Do zweryfikowania przed startem prac:**

- [ ] Czy modele `LatexTemplate` i `LatexElement` zostały już dodane do `schema.prisma` w ramach wcześniejszej migracji (były zaprojektowane z wyprzedzeniem właśnie po to, żeby uniknąć drugiej migracji) — jeśli tak, ten dokument **nie wymaga zmian w bazie**, tylko CRUD + UI. Jeśli nie, wykonaj krok 1 z sekcji 9.
- [ ] Czy komponent edytora (`latex-editor-modal.tsx` / `latex-code-panel.tsx` / `latex-preview-panel.tsx`) jest wystarczająco generyczny, żeby obsłużyć edycję `LatexTemplate.sourceCode` obok `LatexDocument.sourceCode` — jeśli nie, lekko go zrefaktoryzuj (przyjmowanie entity type + id jako props), zamiast pisać drugi, prawie identyczny edytor.

---

## 3. Zakres (in / out of scope)

### W zakresie

1. Rozwinięcie przycisku "Edycja i Kompilacja Materiałów" w **listę rozwijalną** z trzema opcjami: "Zarządzanie materiałem" (już istnieje, bez zmian), "Zarządzanie szablonami", "Zarządzanie elementami".
2. **Szablony:** tworzenie ("Stwórz szablon"), przeglądanie ("Podgląd szablonów"), edycja, usuwanie. Możliwość rozpoczęcia nowego materiału na bazie szablonu (kod kopiowany).
3. **Elementy:** pełny CRUD (tworzenie, edycja, usuwanie, przeglądanie) + wstawianie do dokumentu z poziomu edytora ("Dodaj element"), wielokrotnie w jednym materiale.

### Poza zakresem

- Zmiana logiki samego tworzenia/publikacji materiału (`LatexDocument` → `Material`) — bez zmian.
- Kategoryzacja/tagowanie szablonów i elementów (np. "algebra", "geometria") — nie było w specyfikacji, do rozważenia jako osobne ulepszenie.
- Udostępnianie szablonów/elementów między nauczycielami — każdy widzi i zarządza wyłącznie swoimi.

---

## 4. Wymagania funkcjonalne (user stories)

### 4.1 Rozwijana lista pod "Edycja i Kompilacja Materiałów"

**Jako** nauczyciel, **chcę** kliknąć w "Edycja i Kompilacja Materiałów" i zobaczyć trzy opcje do wyboru, **aby** dotrzeć do właściwej funkcji (materiał / szablon / element).

Ścieżka: `Dashboard → "Edycja i Kompilacja Materiałów" (rozwija listę) → "Zarządzanie materiałem" | "Zarządzanie szablonami" | "Zarządzanie elementami"`

### 4.2 Tworzenie szablonu

**Jako** nauczyciel, **chcę** stworzyć szablon z gotowym początkiem kodu LaTeX, **aby** wielokrotnie zaczynać od niego nowe materiały.

Ścieżka: `"Zarządzanie szablonami" → "Stwórz szablon" → (ten sam edytor split-screen co dla materiałów, zapisujący do LatexTemplate zamiast LatexDocument)`

### 4.3 Podgląd i edycja szablonów

**Jako** nauczyciel, **chcę** zobaczyć listę moich szablonów i móc je edytować, **aby** poprawiać swój "boilerplate" w miarę potrzeb.

Ścieżka: `"Zarządzanie szablonami" → "Podgląd szablonów" → lista → "Edytuj" → edytor z wypełnionym kodem szablonu`

**Kluczowa reguła:** edycja szablonu **nie zmienia** kodu w materiałach, które z niego wcześniej skorzystały — bo kod został **skopiowany** w momencie tworzenia dokumentu, nie referencjonowany. Analogicznie usunięcie szablonu.

### 4.4 Start materiału z szablonu

**Jako** nauczyciel, **chcę** przy tworzeniu nowego materiału ("Zarządzanie materiałem" → nowy dokument) móc wybrać jeden z moich szablonów jako punkt startowy, **aby** nie zaczynać od pustej strony.

Jeśli nauczyciel nie ma jeszcze żadnego szablonu, ta opcja jest niedostępna/ukryta — zgodnie ze specyfikacją: _"Gdy nauczyciel będzie miał już stworzony minimum jeden szablon to będzie mógł następnie zaczynać z nim tworzenie materiału."_

### 4.5 CRUD elementów

**Jako** nauczyciel, **chcę** tworzyć, edytować, usuwać i przeglądać elementy (nazwane fragmenty kodu LaTeX), **aby** mieć bibliotekę powtarzalnych bloków.

Ścieżka: `"Zarządzanie elementami" → lista elementów → "Stwórz element" / "Edytuj" / "Usuń"`

### 4.6 Wstawianie elementu w edytorze materiału

**Jako** nauczyciel, **chcę** w trakcie edycji materiału kliknąć "Dodaj element" i wybrać jeden ze swoich elementów, **aby** wstawić jego kod w miejscu kursora, tak wiele razy, ile potrzebuję w tym samym materiale.

---

## 5. Model danych

**Bez zmian względem tego, co już zaprojektowano** (patrz `latex-editor-dokumentacja-agentowa.md`, sekcja 5) — o ile modele zostały tam już dodane do schematu. Dla porządku, oczekiwany kształt:

```prisma
model LatexTemplate {
  id          String   @id @default(cuid())
  title       String
  sourceCode  String   @db.Text
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  documents   LatexDocument[]   // informacyjnie, kto z tego skorzystał — nie wpływa na treść dokumentów

  @@index([ownerId])
}

model LatexElement {
  id           String   @id @default(cuid())
  name         String
  snippetCode  String   @db.Text
  ownerId      String
  owner        User     @relation(fields: [ownerId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([ownerId])
}
```

Jeśli te modele **nie** istnieją jeszcze w bazie — wykonaj migrację jako krok 1 planu implementacji (sekcja 9). Jeśli istnieją — ten feature to czysty CRUD + UI, bez zmian w schemacie.

---

## 6. Endpointy API

Zgodnie z konwencją `/api/teacher/*` już stosowaną w projekcie.

### Szablony

| Metoda   | Ścieżka                                     | Opis                                                                                       | Auth                   |
| -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------- |
| `GET`    | `/api/teacher/latex-templates`              | Lista szablonów nauczyciela                                                                | `TEACHER`              |
| `POST`   | `/api/teacher/latex-templates`              | Tworzy nowy szablon (`title`, `sourceCode`)                                                | `TEACHER`              |
| `GET`    | `/api/teacher/latex-templates/[id]`         | Pobiera szablon (do edycji/podglądu)                                                       | `TEACHER` (owner-only) |
| `PUT`    | `/api/teacher/latex-templates/[id]`         | Aktualizuje `title`/`sourceCode`                                                           | `TEACHER` (owner-only) |
| `DELETE` | `/api/teacher/latex-templates/[id]`         | Usuwa szablon                                                                              | `TEACHER` (owner-only) |
| `POST`   | `/api/teacher/latex-templates/[id]/compile` | Kompiluje aktualny kod szablonu do podglądu (reużycie `compileLatex` z `src/lib/latex.ts`) | `TEACHER` (owner-only) |

### Elementy

| Metoda   | Ścieżka                            | Opis                                   | Auth                   |
| -------- | ---------------------------------- | -------------------------------------- | ---------------------- |
| `GET`    | `/api/teacher/latex-elements`      | Lista elementów nauczyciela            | `TEACHER`              |
| `POST`   | `/api/teacher/latex-elements`      | Tworzy element (`name`, `snippetCode`) | `TEACHER`              |
| `PUT`    | `/api/teacher/latex-elements/[id]` | Aktualizuje element                    | `TEACHER` (owner-only) |
| `DELETE` | `/api/teacher/latex-elements/[id]` | Usuwa element                          | `TEACHER` (owner-only) |

> Elementy **nie mają** endpointu `compile` — to fragmenty kodu, niekoniecznie kompilowalne samodzielnie (np. sam fragment definicji kratki, bez dokumentu nadrzędnego). Podgląd elementu w UI to zwykły blok kodu z podświetlaniem składni, nie skompilowany PDF.

### Istniejący endpoint — wymagane rozszerzenie

| Metoda                              | Ścieżka                    | Zmiana                                                                                                                                                                                           |
| ----------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /api/teacher/latex-documents` | Tworzenie nowego dokumentu | Dodać opcjonalne pole `templateId` w body. Jeśli podane: `sourceCode` nowego `LatexDocument` = **kopia** `LatexTemplate.sourceCode` (nie referencja), plus zapisanie `templateId` informacyjnie. |

```typescript
const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  templateId: z.string().cuid().optional(),
});

// w handlerze:
const sourceCode = templateId
  ? (
      await prisma.latexTemplate.findUniqueOrThrow({
        where: { id: templateId },
      })
    ).sourceCode
  : DEFAULT_EMPTY_LATEX_BOILERPLATE; // np. minimalny szkielet \documentclass{article}...

const doc = await prisma.latexDocument.create({
  data: {
    title,
    sourceCode,
    ownerId: session.user.id,
    templateId: templateId ?? null,
  },
});
```

Walidacja własności: przy `templateId` podanym w body, zweryfikuj że `LatexTemplate.ownerId === session.user.id` — inaczej `403`.

---

## 7. Architektura UI

### Zmiana menu — lista rozwijalna

```
src/components/dashboard/sidebar/latex-menu-item.tsx
```

Zamienia dzisiejszy prosty przycisk "Edycja i Kompilacja Materiałów" na komponent z rozwijaną listą (Shadcn `DropdownMenu` lub `Collapsible`):

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Edycja i Kompilacja Materiałów</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={openMaterialFilenameDialog}>
      Zarządzanie materiałem
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push("/dashboard/latex-templates")}>
      Zarządzanie szablonami
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push("/dashboard/latex-elements")}>
      Zarządzanie elementami
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Nowe strony i komponenty

```
src/app/dashboard/latex-templates/page.tsx          <- "Podgląd szablonów": lista + akcje Edytuj/Usuń/Stwórz nowy
src/app/dashboard/latex-templates/[id]/page.tsx     <- edytor szablonu (reużycie latex-editor-modal.tsx w trybie "template")
src/app/dashboard/latex-elements/page.tsx           <- "Zarządzanie elementami": lista + CRUD

src/components/latex-editor/
├── latex-template-list.tsx        (kafelki/lista szablonów: tytuł, data edycji, przyciski Edytuj/Usuń)
├── latex-element-list.tsx         (lista elementów: nazwa, podgląd fragmentu kodu, przyciski Edytuj/Usuń)
├── latex-element-form-dialog.tsx  (formularz tworzenia/edycji elementu: nazwa + textarea/edytor kodu)
├── latex-template-picker.tsx      (wybór szablonu przy tworzeniu nowego materiału — widoczny tylko gdy istnieje ≥1 szablon)
└── latex-element-picker.tsx       (przycisk "Dodaj element" w edytorze → lista do wyboru → wstawienie w miejscu kursora)
```

### Reużycie edytora dla szablonów

`latex-editor-modal.tsx` (już istniejący) przyjmuje props określające typ encji:

```tsx
<LatexEditorModal entityType="document" entityId={documentId} />
<LatexEditorModal entityType="template" entityId={templateId} />
```

Wewnątrz komponent wywołuje odpowiedni zestaw endpointów (`latex-documents` vs `latex-templates`) na podstawie `entityType`, ale UI (split-screen, przycisk Zapisz, Ctrl+S) pozostaje identyczne. Różnica: dla `entityType="template"` przycisk finalizujący to **"Zapisz szablon"**, nie "Zapisz jako PDF i wstaw do materiałów" — szablon nigdy nie jest publikowany jako materiał.

### Wstawianie elementu — mechanika (czysto po stronie klienta)

```typescript
function insertElementAtCursor(editorView: EditorView, snippetCode: string) {
  const cursorPos = editorView.state.selection.main.head;
  editorView.dispatch({
    changes: { from: cursorPos, insert: snippetCode },
  });
}
```

Brak wywołania API poza pobraniem listy elementów (`GET /api/teacher/latex-elements`) — samo wstawienie to operacja lokalna na stanie edytora (np. CodeMirror `EditorView.dispatch`). Zmieniony `sourceCode` trafia do bazy dopiero przy kolejnym "Zapisz" (`PUT /api/teacher/latex-documents/[id]`), zgodnie z istniejącą logiką edytora.

### Picker szablonu przy tworzeniu materiału

`latex-filename-dialog.tsx` (już istniejący, pyta o nazwę pliku) — rozszerzyć o krok wyboru szablonu **tylko jeśli** `GET /api/teacher/latex-templates` zwraca niepustą listę:

```
Podaj nazwę pliku → [jeśli są szablony] Wybierz szablon (opcjonalnie: "Zacznij od pustego") → utworzenie dokumentu → otwarcie edytora
```

---

## 8. Logika biznesowa — kluczowe reguły

1. **Kopiowanie, nigdy referencja.** `sourceCode`/`snippetCode` szablonu i elementu są kopiowane do dokumentu w momencie użycia. `LatexDocument.templateId` służy wyłącznie do celów informacyjnych ("z jakiego szablonu started"), nigdy nie jest odczytywany jako źródło aktualnego kodu.
2. **Edycja/usunięcie szablonu nie wpływa na istniejące dokumenty.** Zapewnione samą architekturą (kopiowanie), ale zweryfikuj to explicité testem (sekcja 10).
3. **Element może być wstawiony wielokrotnie w tym samym dokumencie** — nie ma żadnego licznika/limitu ani deduplikacji w treści dokumentu.
4. **Szablon jest używany raz, na start dokumentu** — nie ma mechanizmu "wstaw szablon w środku istniejącego dokumentu" (to różnica względem elementu, zgodnie ze specyfikacją).
5. **Widoczność picker'a szablonu jest warunkowa** — jeśli nauczyciel nie ma żadnego szablonu, opcja wyboru szablonu nie pojawia się (nie pokazujemy pustej listy do wyboru).
6. **Własność:** wszystkie operacje na `LatexTemplate`/`LatexElement` weryfikują `ownerId === session.user.id` po stronie serwera.

---

## 9. Plan implementacji krok po kroku

1. **Baza danych (warunkowo)**
   - [ ] Zweryfikować, czy `LatexTemplate`/`LatexElement` już istnieją w schemacie. Jeśli nie — dodać je i wykonać `npx prisma db push`.
2. **Backend — Szablony**
   - [ ] `GET/POST /api/teacher/latex-templates`, `GET/PUT/DELETE /api/teacher/latex-templates/[id]`, `POST .../compile`.
   - [ ] Rozszerzenie `POST /api/teacher/latex-documents` o `templateId` (kopiowanie kodu).
3. **Backend — Elementy**
   - [ ] `GET/POST /api/teacher/latex-elements`, `PUT/DELETE /api/teacher/latex-elements/[id]`.
4. **UI — menu**
   - [ ] Zamiana przycisku "Edycja i Kompilacja Materiałów" na `DropdownMenu` z trzema opcjami.
5. **UI — Szablony**
   - [ ] Strona listy szablonów (`latex-template-list.tsx`) z akcjami Edytuj/Usuń/Stwórz nowy.
   - [ ] Rozszerzenie `latex-editor-modal.tsx` o `entityType="template"`.
   - [ ] `latex-template-picker.tsx` podpięty do `latex-filename-dialog.tsx`.
6. **UI — Elementy**
   - [ ] Strona listy elementów + `latex-element-form-dialog.tsx` (prosty formularz, bez potrzeby pełnego split-screen edytora — element to zwykle krótki fragment).
   - [ ] `latex-element-picker.tsx` + integracja z głównym edytorem materiału (przycisk "Dodaj element").
7. **QA i wdrożenie**
   - [ ] Testy z sekcji 10.
   - [ ] Code review + merge.
   - [ ] Deploy po feature'ach, od których ten zależy (`latex-editor` fazy 1-4 muszą już działać na produkcji).

---

## 10. Testowanie

- **Jednostkowe:** logika kopiowania kodu przy tworzeniu dokumentu z szablonu (poprawna zawartość `sourceCode` po utworzeniu).
- **Integracyjne (API):**
  - edycja szablonu **po** utworzeniu z niego dokumentu nie zmienia `sourceCode` tego dokumentu,
  - usunięcie szablonu nie usuwa i nie psuje dokumentów, które z niego korzystały (`onDelete: SetNull` działa poprawnie — `LatexDocument.templateId` staje się `null`, `sourceCode` pozostaje bez zmian),
  - próba edycji/usunięcia cudzego szablonu/elementu → `403`.
- **E2E:**
  - stworzenie szablonu → stworzenie nowego materiału z tego szablonu → weryfikacja, że kod startowy się zgadza,
  - stworzenie elementu → wstawienie go dwukrotnie w tym samym dokumencie → weryfikacja, że kod pojawia się dwa razy w odpowiednich miejscach,
  - nauczyciel bez żadnego szablonu nie widzi opcji wyboru szablonu przy tworzeniu nowego materiału.

---

## 11. Bezpieczeństwo i uprawnienia

- Standardowe reguły projektu: `auth()` + `role === TEACHER` + weryfikacja `ownerId` na każdym endpointcie z sekcji 6.
- Kompilacja podglądu szablonu (`POST .../latex-templates/[id]/compile`) podlega **dokładnie tym samym** zasadom bezpieczeństwa co kompilacja dokumentu (patrz `latex-editor-dokumentacja-agentowa.md`, sekcja 11 — wyłączony shell-escape, timeout, izolowany katalog roboczy). Reużyj tę samą funkcję `compileLatex`, nie pisz drugiej implementacji.

---

## 12. Otwarte pytania i ryzyka

- ❓ **Limit liczby szablonów/elementów na nauczyciela** — specyfikacja tego nie porusza, ale warto rozważyć rozsądny limit (np. UX listy przy setkach elementów).
- ❓ **Czy element powinien mieć podgląd skompilowany** (np. mini-PDF pokazujący jak wygląda "kratka do liczb"), czy wystarczy podgląd samego kodu? Specyfikacja sugeruje tylko listę z kodem — zostawiam jako podstawowy zakres, z furtką do rozszerzenia.
- ❓ **Sortowanie/wyszukiwanie w listach szablonów/elementów** — przy większej liczbie pozycji może być potrzebne; nie było w specyfikacji, do potwierdzenia czy wchodzi w ten etap.
- ⚠️ **Zależność:** ten feature nie ma sensu bez ukończonych faz 1-4 `latex-editor` — pilnować kolejności wdrożeń.

---

## 13. Definicja ukończenia (Definition of Done)

- [ ] Przycisk "Edycja i Kompilacja Materiałów" rozwija listę trzech opcji.
- [ ] Pełny CRUD szablonów działa, z podglądem skompilowanym w edytorze.
- [ ] Pełny CRUD elementów działa.
- [ ] Nowy materiał można rozpocząć od wybranego szablonu (kod skopiowany, nie referencjonowany).
- [ ] Element można wstawić wielokrotnie w edytorze materiału, w miejscu kursora.
- [ ] Edycja/usunięcie szablonu lub elementu nie wpływa na już istniejące materiały — potwierdzone testem.
- [ ] Reguły uprawnień (owner-only) pokryte testami.
- [ ] Code review zaakceptowany.
