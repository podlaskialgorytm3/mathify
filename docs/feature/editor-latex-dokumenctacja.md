# Dokumentacja techniczna dla agenta AI: Edytor & Kompilator LaTeX

**Projekt:** Mathify
**Feature:** `latex-editor` (Własny Edytor & Kompilator Tekstu)
**Odbiorca dokumentu:** agent AI do kodowania (np. Claude Code)
**Status:** Do implementacji, faza po fazie

---

## 0. Jak korzystać z tego dokumentu (instrukcja dla agenta)

Ten dokument jest specyfikacją wykonawczą, nie tylko opisową. Sekcja 9 ("Plan implementacji krok po kroku") jest napisana jako sekwencja zadań — wykonuj je **w podanej kolejności**, bo późniejsze fazy zakładają, że wcześniejsze już istnieją (np. UI edytora zakłada, że endpoint kompilacji już działa). Przed każdą fazą zajrzyj do odpowiadającej jej sekcji ze szczegółami (model danych, endpointy, komponenty).

Zawsze, przed dodaniem nowego pliku/endpointu, sprawdź czy coś podobnego już istnieje w strukturze opisanej w sekcji 2 i 3 — nie duplikuj.

---

## 1. Kontekst projektu

- **Stack:** Next.js 15 (App Router), React 19, TypeScript, PostgreSQL + Prisma 5, NextAuth v5, Shadcn/ui + Tailwind, Cloudinary (storage plików), Docker Compose.
- **Struktura katalogów:**
  ```
  src/app/api/            <- endpointy backendowe (route.ts)
  src/app/dashboard/...   <- strony frontendu (page.tsx)
  src/components/ui/      <- komponenty Shadcn
  src/lib/auth.ts         <- auth()
  src/lib/prisma.ts       <- klient Prismy
  src/lib/cloudinary.ts   <- upload/zarządzanie plikami
  prisma/schema.prisma    <- schemat bazy
  ```
- Server Components domyślnie; `"use client"` tylko tam, gdzie potrzebny jest stan/interakcja.
- Autoryzacja przez `auth()` + sprawdzenie `session.user.role`.
- Walidacja requestów przez `Zod`.
- Nowe komponenty UI budować na Shadcn (`npx shadcn@latest add ...`), nie pisać czystego CSS.

---

## 2. Istniejąca struktura bazy danych (stan obecny — nie modyfikować bez wyraźnej potrzeby)

| Model | Kluczowe pola | Rola w tym feature |
|---|---|---|
| `User` | `id`, `role` (ADMIN/TEACHER/STUDENT), `firstName`, `lastName` | Właściciel dokumentów/szablonów/elementów LaTeX (nauczyciel) |
| `Course` | `id`, `teacherId`, `title`, `homeworkFileName` | Kontekst, w którym materiał (efekt kompilacji) jest osadzony |
| `Chapter` | `id`, `courseId`, `order`, `visibilityType`, ... | Struktura kursu |
| `Subchapter` | `id`, `chapterId`, `allowSubmissions`, `visibilityType`, ... | Miejsce docelowe materiału po skompilowaniu |
| `Material` | `id`, `title`, `description`, `order`, `type` (PDF/LINK), `content`, `subchapterId` | **Tu wynik kompilacji trafia jako nowy/podmieniony PDF** |
| `Submission` | `id`, `subchapterId`, `studentId`, `filePath`, `status` | Bez związku z tym feature'em |
| `AIResult`, `Task`, `SubmissionReview`, `AIPromptTemplate` | — | Bez związku z tym feature'em |

> ⚠️ **Zależność od wcześniejszego feature'a `data-disk`:** jeśli `data-disk` (relacja N:N `Material ↔ Subchapter` przez tabelę `MaterialSubchapter`) jest już wdrożony, to podmiana pliku PDF w istniejącym `Material` (edycja LaTeX-a) **automatycznie propaguje się** do wszystkich podrozdziałów, w których ten materiał jest referencjonowany — bo to wciąż ten sam rekord `Material`, tylko z podmienionym `content`. To dokładnie zachowanie opisane w specyfikacji: *"stary plik PDF zostaje automatycznie usunięty i podmieniony tym nowym. I wszędzie tam gdzie użyto tego PDF tak samo."* Zaprojektuj ten feature zakładając docelowy model z `data-disk` (patrz sekcja 5).

## 3. Istniejące endpointy API (stan obecny — punkt odniesienia dla konwencji)

```
/api/auth/[...nextauth]                                  – logowanie (NextAuth)
/api/profile                                             – GET/PATCH profilu

/api/student/courses                                     – GET
/api/student/courses/[courseId]                          – GET
/api/student/courses/[courseId]/subchapters/[id]         – GET
/api/student/submissions                                 – GET/POST/DELETE

/api/teacher/courses                                     – GET/POST
/api/teacher/courses/[id]                                – GET/PUT/DELETE
/api/teacher/courses/[id]/chapters                       – POST
/api/teacher/chapters/[chapterId]/subchapters            – POST
/api/teacher/subchapters/[subchapterId]/materials        – POST (dodanie materiału)
/api/teacher/materials/[materialId]                      – PUT/DELETE
/api/teacher/materials/bulk-delete                       – POST
/api/teacher/students                                    – GET
/api/teacher/ai-prompts                                  – GET/POST

/api/admin/*                                              – zarządzanie platformą
/api/cloudinary/signed-url                                – GET (prywatne URL)
/api/upload                                               – POST (upload do Cloudinary)
```

Nowe endpointy tego feature'a idą w namespace `/api/teacher/latex-*` (sekcja 7), zgodnie z istniejącą konwencją.

---

## 4. Cel i zakres feature'a

Nauczyciel ma móc **tworzyć materiały PDF bezpośrednio w aplikacji**, pisząc kod LaTeX w edytorze z podglądem na żywo (kompilacja do PDF), zamiast tylko wgrywać gotowe pliki. Docelowo ma to wspierać też **szablony** (gotowy punkt startowy kodu) i **elementy** (wstawiane, powtarzalne fragmenty kodu).

### W zakresie (do zaimplementowania teraz — fazy 1-4 z sekcji 9)
1. Czwarta opcja w "Dodaj Materiał": **"Stwórz własne"** — pełnoekranowy edytor LaTeX + podgląd na żywo → zapis jako PDF → wstawienie do materiałów podrozdziału.
2. Edycja istniejącego materiału stworzonego tą drogą — ten sam edytor, wypełniony aktualnym kodem, zapis **podmienia** PDF w tym samym `Material`.
3. Osobny punkt wejścia w Dashboardzie nauczyciela: przycisk **"Edycja i Kompilacja Materiałów"** — pyta o nazwę pliku, otwiera ten sam edytor, tworzy dokument **niezwiązany jeszcze z żadnym podrozdziałem** (do późniejszego wstawienia).

### Poza zakresem teraz, ale zaprojektuj model danych z myślą o tym (faza 5, na przyszłość)
4. Rozwijana lista pod "Edycja i Kompilacja Materiałów" z trzema opcjami: "Zarządzanie materiałem" (to, co wyżej), "Zarządzanie szablonami" (CRUD + start dokumentu z szablonu — kod **kopiowany**, nie referencjonowany), "Zarządzanie elementami" (CRUD + wstawianie fragmentu kodu w dowolnym miejscu, wielokrotnie, w edytorze — też **kopiowanie** kodu, nie referencja).

---

## 5. Model danych — nowe tabele w `schema.prisma`

```prisma
model LatexDocument {
  id           String   @id @default(cuid())
  title        String                     // nazwa pliku, podawana przy tworzeniu z Dashboardu
  sourceCode   String   @db.Text          // aktualny kod LaTeX
  ownerId      String
  owner        User     @relation(fields: [ownerId], references: [id])

  materialId   String?  @unique           // NULL dopóki nie "wstawiono do materiałów"; 1:1 z Material po publikacji
  material     Material? @relation(fields: [materialId], references: [id], onDelete: SetNull)

  templateId   String?                    // z jakiego szablonu wystartował (informacyjnie, kod i tak skopiowany)
  template     LatexTemplate? @relation(fields: [templateId], references: [id], onDelete: SetNull)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([ownerId])
}

model LatexTemplate {
  id          String   @id @default(cuid())
  title       String
  sourceCode  String   @db.Text
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  documents   LatexDocument[]   // tylko informacyjnie "kto z tego korzystał", nie wpływa na ich treść

  @@index([ownerId])
}

model LatexElement {
  id           String   @id @default(cuid())
  name         String                 // widoczna nazwa w UI ("Kratka do liczb")
  snippetCode  String   @db.Text      // fragment LaTeX wstawiany do edytora
  ownerId      String
  owner        User     @relation(fields: [ownerId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([ownerId])
}
```

**Zmiana w istniejącym modelu `Material`:** dodać relację zwrotną do `LatexDocument` (bez zmiany istniejących pól):
```prisma
model Material {
  // ...istniejące pola bez zmian...
  latexDocument LatexDocument?
}
```

**Kluczowe reguły modelu danych (zaimplementuj dokładnie tak):**
- `LatexTemplate.sourceCode` i `LatexElement.snippetCode` są **kopiowane** do `LatexDocument.sourceCode` w momencie użycia — `templateId` na `LatexDocument` służy tylko do celów informacyjnych/analitycznych, **nigdy** nie odczytuj z niego kodu na żywo. Usunięcie lub edycja szablonu/elementu **nie może** wpłynąć na już istniejące dokumenty — to wymóg wprost ze specyfikacji.
- `LatexDocument.materialId` jest `NULL` dla dokumentów tworzonych z poziomu "Edycja i Kompilacja Materiałów" (Dashboard) dopóki nauczyciel nie przypisze ich do podrozdziału. Jest wypełnione dla dokumentów tworzonych z poziomu "Dodaj Materiał → Stwórz własne" od razu przy publikacji.
- Relacja `LatexDocument -> Material` jest **1:1** — jeden materiał może pochodzić z co najwyżej jednego dokumentu LaTeX (materiał wgrany klasycznie, jako plik, nie ma powiązanego `LatexDocument`).

---

## 6. Usługa kompilacji LaTeX → PDF (kluczowy element architektury)

To jedyny naprawdę nowy element infrastruktury w tym feature — reszta to CRUD i UI.

### Rekomendowane podejście
Dodać silnik LaTeX do obrazu Docker aplikacji (lub do osobnego, lekkiego kontenera-workera):
- `tectonic` (zalecany — samodzielny, nie wymaga instalacji całego TeX Live, mniejszy obraz, szybszy start) **lub**
- `texlive-latex-base` + potrzebne pakiety, jeśli `tectonic` nie obsłuży wymaganych bibliotek.

Endpoint kompilacji (`POST /api/teacher/latex-documents/[id]/compile`) w Next.js:
1. Zapisuje `sourceCode` do tymczasowego pliku `.tex` w izolowanym katalogu roboczym (`/tmp/latex-jobs/<uuid>/`).
2. Odpala proces kompilatora przez `child_process.execFile` (**nie** `exec` — patrz sekcja 11, bezpieczeństwo) z limitem czasu (timeout, np. 15s) i limitem pamięci/procesu jeśli środowisko na to pozwala.
3. Jeśli kompilacja się powiedzie — zwraca wygenerowany PDF (strumieniuje plik lub zapisuje tymczasowo i zwraca URL do podglądu).
4. Jeśli się nie powiedzie — parsuje log błędów kompilatora i zwraca go do UI (żeby nauczyciel widział, w której linijce jest błąd).
5. Czyści katalog roboczy po zakończeniu (sukces i błąd).

### Alternatywa (jeśli dodanie silnika LaTeX do obrazu Docker jest niepożądane)
Zewnętrzne API kompilujące LaTeX (np. istnieją publiczne/samohostowane serwisy tego typu) wywoływane przez `fetch` z backendu. Zaletą jest brak potrzeby rozbudowy obrazu Docker; wadą — zależność od zewnętrznej usługi i konieczność wysyłania (potencjalnie prywatnej) treści materiałów na zewnątrz. **Decyzja do podjęcia przed implementacją fazy 1** — patrz sekcja 12.

---

## 7. Nowe endpointy API

| Metoda | Ścieżka | Opis | Auth |
|---|---|---|---|
| `POST` | `/api/teacher/latex-documents` | Tworzy nowy `LatexDocument` (pusty lub z `templateId` — wtedy kopiuje `sourceCode` szablonu) | `TEACHER` |
| `GET` | `/api/teacher/latex-documents/[id]` | Pobiera dokument (metadane + `sourceCode`) | `TEACHER` (owner-only) |
| `PUT` | `/api/teacher/latex-documents/[id]` | Aktualizuje `sourceCode`/`title` (autosave przy Ctrl+S / "Zapisz") | `TEACHER` (owner-only) |
| `POST` | `/api/teacher/latex-documents/[id]/compile` | Kompiluje aktualny `sourceCode` do PDF, zwraca podgląd lub log błędu — **nie** zapisuje nic trwale poza samym dokumentem | `TEACHER` (owner-only) |
| `POST` | `/api/teacher/latex-documents/[id]/publish` | Finalna kompilacja → upload PDF do Cloudinary → utworzenie **lub aktualizacja** powiązanego `Material` (body: `subchapterId`, wymagany tylko przy pierwszej publikacji) | `TEACHER` (owner-only) |
| `GET` | `/api/teacher/latex-templates` | Lista szablonów nauczyciela | `TEACHER` |
| `POST` | `/api/teacher/latex-templates` | Tworzy szablon | `TEACHER` |
| `PUT` / `DELETE` | `/api/teacher/latex-templates/[id]` | Edycja / usunięcie szablonu | `TEACHER` (owner-only) |
| `GET` | `/api/teacher/latex-elements` | Lista elementów nauczyciela | `TEACHER` |
| `POST` | `/api/teacher/latex-elements` | Tworzy element | `TEACHER` |
| `PUT` / `DELETE` | `/api/teacher/latex-elements/[id]` | Edycja / usunięcie elementu | `TEACHER` (owner-only) |

### Kontrakt `POST /api/teacher/latex-documents/[id]/publish`

```typescript
const publishSchema = z.object({
  subchapterId: z.string().cuid().optional(), // wymagany tylko gdy document.materialId === null
  title: z.string().min(1).max(200),          // tytuł widoczny w materiałach
});
```

Logika serwera:
```typescript
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") return new Response("Brak dostępu", { status: 403 });

  const doc = await prisma.latexDocument.findUnique({ where: { id: params.id } });
  if (!doc || doc.ownerId !== session.user.id) return new Response("Brak dostępu", { status: 403 });

  const { subchapterId, title } = publishSchema.parse(await req.json());

  const pdfBuffer = await compileLatex(doc.sourceCode); // rzuca błąd z logiem kompilacji przy niepowodzeniu
  const { url } = await uploadToCloudinary(pdfBuffer, { resourceType: "raw" });

  if (doc.materialId) {
    // EDYCJA ISTNIEJĄCEGO MATERIAŁU — podmiana pliku, ten sam rekord Material
    const oldMaterial = await prisma.material.findUnique({ where: { id: doc.materialId } });
    await deleteFromCloudinary(oldMaterial.content); // usunięcie starego pliku z Cloudinary
    await prisma.material.update({
      where: { id: doc.materialId },
      data: { title, content: url },
    });
  } else {
    // PIERWSZA PUBLIKACJA — nowy Material + podpięcie do subchapterId
    if (!subchapterId) return new Response("Brak subchapterId", { status: 400 });
    const material = await prisma.material.create({
      data: { title, type: "PDF", content: url, subchapterId, order: 0 }, // dopasuj `order` do realnej logiki sortowania
    });
    await prisma.latexDocument.update({ where: { id: doc.id }, data: { materialId: material.id } });
  }

  return Response.json({ pdfUrl: url });
}
```

> Jeśli w momencie implementacji `data-disk` jest już wdrożony (`Material` łączy się z `Subchapter` przez `MaterialSubchapter`, nie przez bezpośrednie pole), dostosuj powyższy kod tworzenia `Material` do tego modelu (utworzenie `Material` + osobny wpis w `MaterialSubchapter`).

---

## 8. Architektura UI

### Nowe strony/komponenty
```
src/app/dashboard/latex-editor/[id]/page.tsx      <- pełnoekranowy edytor (Client Component)

src/components/latex-editor/
├── latex-editor-modal.tsx      (POP-UP pełnoekranowy — używany zarówno z "Dodaj Materiał", jak i z Dashboardu)
├── latex-code-panel.tsx        (lewa strona: edytor kodu, np. CodeMirror z trybem LaTeX/STeX)
├── latex-preview-panel.tsx     (prawa strona: podgląd PDF, np. <iframe> lub react-pdf)
├── latex-toolbar.tsx           (przyciski: Zapisz, Zapisz jako PDF i wstaw, Dodaj element)
├── latex-filename-dialog.tsx   (dialog z pytaniem o nazwę pliku — punkt wejścia z Dashboardu)
├── latex-template-picker.tsx   (faza 5 — wybór szablonu przy tworzeniu nowego dokumentu)
├── latex-element-picker.tsx    (faza 5 — wybór elementu do wstawienia)
```

### Integracja z istniejącym UI
- W dialogu "Dodaj Materiał" (patrz zrzut ekranu w specyfikacji — obecnie zakładki "Dodawanie szybkie" / "Dodawanie normalne") dodać trzecią **lub** czwartą zakładkę **"Stwórz własne"** (w zależności czy `data-disk` z jego "Dodawanie istniejących materiałów" jest już wdrożony — wtedy to będzie zakładka **czwarta**). Kliknięcie otwiera `latex-editor-modal.tsx` w trybie "nowy dokument, bez `subchapterId` ustawionego z góry" (subchapterId znany z kontekstu strony, na której otwarto dialog).
- Przy istniejącym materiale utworzonym z LaTeX-a (czyli `Material.latexDocument` nie jest `null`) — przycisk "Edytuj" przy materiale otwiera `latex-editor-modal.tsx` z `documentId = material.latexDocument.id`, wypełniony aktualnym kodem. Materiały bez powiązanego `LatexDocument` (klasyczny upload) nadal używają istniejącego flow edycji (zmiana tytułu/pliku), **bez zmian**.
- W sidebarze Dashboardu nauczyciela dodać przycisk **"Edycja i Kompilacja Materiałów"** (ikona np. `FileCode` z `lucide-react`), obok istniejących pozycji menu, dokładnie tam gdzie w specyfikacji wskazano ("po lewej stronie", w sekcji zarządzania). Kliknięcie → `latex-filename-dialog.tsx` → `POST /api/teacher/latex-documents` (bez `subchapterId`) → przekierowanie do `latex-editor-modal.tsx`.

### Zachowanie edytora (kluczowe dla UX)
- `Ctrl+S` / przycisk "Zapisz" → `PUT /api/teacher/latex-documents/[id]` (zapis kodu) + `POST .../compile` (odświeżenie podglądu) — **nie** publikuje, tylko zapisuje wersję roboczą i odświeża prawą stronę.
- Przycisk "Zapisz jako PDF i wstaw do materiałów" → `POST .../publish` → zamknięcie modala → odświeżenie listy materiałów w tle.
- Debounce na auto-kompilację (nie kompiluj przy każdym naciśnięciu klawisza — po ok. 1-2s bezczynności lub tylko na jawną akcję zapisu, zgodnie z opisem *"po kliknięciu przycisku Zapisz lub po kliknięciu Ctrl+S"*).

---

## 9. Plan implementacji krok po kroku

### Faza 1 — Fundament: baza danych + usługa kompilacji
1. Dodać modele `LatexDocument`, `LatexTemplate`, `LatexElement` do `schema.prisma` (sekcja 5) + relację zwrotną w `Material`.
2. `npx prisma db push` na środowisku deweloperskim.
3. Podjąć i udokumentować decyzję: silnik LaTeX w Dockerze vs zewnętrzne API (sekcja 6) — zaktualizować `Dockerfile`/`docker-compose.yml` jeśli wybrano opcję lokalną.
4. Zaimplementować funkcję `compileLatex(sourceCode: string): Promise<Buffer>` w `src/lib/latex.ts`, z obsługą timeoutu i parsowaniem logu błędów.
5. Napisać testy dla `compileLatex` (poprawny kod → PDF, błędny kod → czytelny log błędu, kod przekraczający timeout → kontrolowany błąd).

### Faza 2 — Backend: podstawowy CRUD dokumentów + kompilacja + publikacja
6. `POST/GET/PUT /api/teacher/latex-documents[/id]` (bez szablonów na razie — `templateId` zawsze `null` w tej fazie).
7. `POST /api/teacher/latex-documents/[id]/compile`.
8. `POST /api/teacher/latex-documents/[id]/publish` — dokładnie wg logiki z sekcji 7, **uwzględniając**, czy `data-disk` jest już wdrożony (patrz uwaga w sekcji 2).

### Faza 3 — UI: edytor + integracja z "Dodaj Materiał"
9. `latex-editor-modal.tsx` + `latex-code-panel.tsx` (CodeMirror z podświetlaniem LaTeX) + `latex-preview-panel.tsx`.
10. `latex-toolbar.tsx` z akcjami Zapisz / Zapisz jako PDF i wstaw, podpięcie skrótu `Ctrl+S`.
11. Dodanie zakładki "Stwórz własne" do istniejącego dialogu "Dodaj Materiał".

### Faza 4 — UI: edycja istniejącego materiału + osobny punkt wejścia z Dashboardu
12. Rozszerzenie widoku materiału o rozpoznanie `latexDocument` i przycisk "Edytuj" prowadzący do edytora zamiast klasycznej edycji.
13. `latex-filename-dialog.tsx` + przycisk "Edycja i Kompilacja Materiałów" w sidebarze Dashboardu.

### Faza 5 — Przyszłość (poza obecnym zakresem, ale model danych już to wspiera)
14. Rozwijana lista pod "Edycja i Kompilacja Materiałów" (3 opcje).
15. CRUD szablonów (`latex-templates`) + `latex-template-picker.tsx` — kopiowanie `sourceCode` przy starcie nowego dokumentu.
16. CRUD elementów (`latex-elements`) + `latex-element-picker.tsx` + przycisk "Dodaj element" w edytorze, wstawiający `snippetCode` w pozycji kursora.

---

## 10. Kluczowe reguły biznesowe (zaimplementuj dokładnie tak)

1. **Edycja = podmiana, nie duplikacja.** Publikacja dokumentu, który już ma `materialId`, aktualizuje istniejący `Material.content`, nie tworzy nowego materiału.
2. **Stary plik fizycznie usuwany z Cloudinary** przy każdej podmianie (żeby nie zaśmiecać storage) — dopiero **po** udanym uploadzie nowego pliku (żeby nie zostać bez żadnego PDF-a, gdyby upload się nie powiódł).
3. **Szablony i elementy = kopiowanie kodu, nigdy referencja.** Kluczowy wymóg ze specyfikacji — usunięcie/edycja szablonu lub elementu nie zmienia treści już istniejących dokumentów.
4. **Kompilacja "na żywo" (podgląd) nie zapisuje pliku trwale** — tylko `publish` tworzy/aktualizuje `Material` i zapisuje PDF do Cloudinary.
5. **Właścicielstwo:** każdy `LatexDocument`/`LatexTemplate`/`LatexElement` należy do jednego nauczyciela (`ownerId`) — wszystkie operacje odczytu/zapisu weryfikują to po stronie serwera.

---

## 11. Bezpieczeństwo (krytyczne — nie pomijać)

- **Nigdy nie uruchamiaj kompilatora LaTeX z włączonym `\write18` / shell-escape.** Ta opcja pozwala kodowi LaTeX wykonywać dowolne polecenia systemowe — to jest realny wektor RCE (Remote Code Execution), jeśli nauczyciel (lub ktoś, kto przejmie jego sesję) wstawi złośliwy kod. Kompilator **musi** być uruchamiany z jawnie wyłączonym shell-escape.
- Uruchamiaj proces kompilacji przez `execFile`, nie `exec`/`spawn` ze stringiem — unikaj interpretacji przez powłokę systemową.
- Ogranicz czas wykonania (timeout) i, jeśli to możliwe w środowisku, zasoby procesu (CPU/pamięć/rozmiar wyjściowego pliku) — zapobiega to prostym atakom typu DoS przez nieskończone pętle w kodzie LaTeX.
- Uruchamiaj kompilację w izolowanym katalogu tymczasowym per-job, czyszczonym po zakończeniu — nie pozwól, by jeden dokument mógł odczytać/nadpisać pliki innego joba.
- Rozważ uruchamianie kompilacji w osobnym, mocno ograniczonym kontenerze/procesie (sandbox) zamiast bezpośrednio w procesie aplikacji Next.js, jeśli skala/ryzyko na to wskazują — do decyzji zespołu, patrz sekcja 12.
- Standardowe reguły projektu: `auth()` + weryfikacja `ownerId` na każdym endpointcie z sekcji 7.

---

## 12. Otwarte pytania i ryzyka

- ❓ **Silnik LaTeX lokalny vs zewnętrzne API** (sekcja 6) — wpływa na Dockerfile, koszty operacyjne i czy treść materiałów opuszcza infrastrukturę. Decyzja wymagana przed Fazą 1.
- ❓ **Limit rozmiaru/złożoności dokumentu LaTeX** (np. max liczba stron, max czas kompilacji) — do ustalenia, żeby zapobiec nadużyciom.
- ❓ **Co się dzieje z `LatexDocument`, gdy powiązany `Material` zostanie usunięty z poziomu Dysku (`data-disk`)?** Proponowane zachowanie: `onDelete: SetNull` na relacji (już w schemacie z sekcji 5) — dokument LaTeX zostaje, ale traci powiązanie z materiałem, więc kolejna publikacja utworzy nowy `Material`. Do potwierdzenia z biznesem.
- ⚠️ **Zależność od `data-disk`:** logika `publish` w sekcji 7 różni się w zależności od tego, czy relacja `Material ↔ Subchapter` jest 1:N czy N:N w momencie implementacji — ustalić kolejność wdrożeń przed Fazą 2.
- ⚠️ **Koszt obliczeniowy kompilacji LaTeX** przy wielu równoczesnych nauczycielach edytujących materiały — rozważyć kolejkowanie (np. prosta kolejka w pamięci lub Redis, jeśli pojawi się w stacku) zamiast bezpośredniego, blokującego wywołania w handlerze API.

---

## 13. Definicja ukończenia (Definition of Done)

- [ ] Modele `LatexDocument`, `LatexTemplate`, `LatexElement` w bazie, migracja wykonana bezpiecznie.
- [ ] Usługa kompilacji działa z wyłączonym shell-escape, timeoutem i izolacją katalogów roboczych.
- [ ] Wszystkie endpointy z sekcji 7 zaimplementowane, z weryfikacją `ownerId`.
- [ ] Zakładka "Stwórz własne" dostępna w "Dodaj Materiał", tworzy nowy materiał z LaTeX-a.
- [ ] Edycja istniejącego materiału LaTeX-owego podmienia plik w tym samym `Material` (bez duplikacji, ze skasowaniem starego pliku z Cloudinary).
- [ ] Przycisk "Edycja i Kompilacja Materiałów" w Dashboardzie, z dialogiem nazwy pliku, tworzy dokument niezwiązany z podrozdziałem.
- [ ] Podgląd na żywo działa poprawnie zarówno dla poprawnego, jak i błędnego kodu LaTeX (czytelny komunikat błędu).
- [ ] Testy bezpieczeństwa: próba wstrzyknięcia polecenia systemowego przez kod LaTeX nie powoduje wykonania kodu na serwerze.
- [ ] Model danych gotowy pod Fazę 5 (szablony/elementy), nawet jeśli UI tej fazy nie jest jeszcze zbudowane.
