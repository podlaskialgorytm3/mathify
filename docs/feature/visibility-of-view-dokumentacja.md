# Dokumentacja projektowa: Feature "Podgląd wyświetleń" (visibility-of-view)

**Projekt:** Mathify
**Status:** Draft do review
**Autor:** (uzupełnij)
**Data:** 2026-08-18

> Dokument oparty na realnej dokumentacji bazy danych/API Mathify oraz specyfikacji funkcjonalności "Podgląd wyświetleń plików z danego podrozdziału".

---

## 1. Cel i kontekst biznesowy

Nauczyciel dziś nie wie, czy uczeń w ogóle **otworzył** materiał, który mu udostępnił — widzi tylko, czy przesłał pracę domową (`Submission`). Feature ma dać nauczycielowi wgląd w to, ile razy dany uczeń wyświetlił poszczególne materiały w podrozdziale, żeby mógł ocenić zaangażowanie i ewentualnie zareagować (przypomnieć, dopytać, dostosować tempo).

### Mierniki sukcesu
- Nauczyciel widzi liczbę wyświetleń materiałów per uczeń, per podrozdział, bez opóźnienia (dane aktualne "na klik").
- Rejestrowanie wyświetlenia nie spowalnia odczuwalnie ładowania materiału przez ucznia (operacja asynchroniczna/nieblokująca).

---

## 2. Analiza obecnego stanu

Istotne fragmenty realnego modelu danych (wg dokumentacji bazy):

```
User (id, role: STUDENT|TEACHER|ADMIN, ...)
 └─ Course (id, teacherId, ...)
     └─ Chapter (id, courseId, visibilityType, ...)
         └─ Subchapter (id, chapterId, allowSubmissions, visibilityType, ...)
             └─ Material (id, subchapterId, type: PDF|LINK, content, ...)
```

- **Nie istnieje dziś żaden model zliczający wyświetlenia** — ani na poziomie `Material`, ani `Subchapter`.
- Istnieje już mechanizm **widoczności** (`visibilityType`, `visibleFromDate`, `visibleUntilDate` na `Chapter`/`Subchapter`) oraz endpoint zarządzania wyjątkami widoczności per uczeń: `GET/PUT /api/teacher/students/[studentId]/courses/[courseId]/visibility`. To **osobna funkcjonalność** (czy uczeń w ogóle widzi dany rozdział/podrozdział) — nowy feature **nie zmienia** tej logiki, tylko **dokłada licznik wyświetleń do tego samego ekranu** (patrz zrzut ekranu w specyfikacji: ikonka oka + liczba przy każdym podrozdziale).
- Uczeń dziś ogląda materiały przez `GET /api/student/courses/[courseId]/subchapters/[subchapterId]` — to naturalne miejsce, gdzie trzeba dopiąć rejestrację wyświetlenia (kliknięcie w materiał).

### ⚠️ Kluczowa zależność międzyficzerowa

Ten feature jest budowany **równolegle** z opisanym wcześniej `data-disk`, który zmienia relację `Material → Subchapter` z **1:N** (pole `subchapterId` bezpośrednio na `Material`) na **N:N** (tabela pośrednia `MaterialSubchapter`).

To ma bezpośredni wpływ na sposób liczenia sumy wyświetleń per podrozdział:

| Scenariusz wdrożenia | Jak liczyć sumę wyświetleń podrozdziału |
|---|---|
| `visibility-of-view` wdrażany **przed** `data-disk` | Suma wyświetleń materiałów, gdzie `Material.subchapterId = X` (prosty JOIN) |
| `visibility-of-view` wdrażany **po** `data-disk` | Suma wyświetleń materiałów, gdzie istnieje wpis w `MaterialSubchapter` łączący `materialId` z `subchapterId = X` (JOIN przez tabelę pośrednią) |

**Rekomendacja:** wdrożyć `data-disk` (przynajmniej migrację schematu) **przed** `visibility-of-view`, żeby nie pisać zapytania agregującego dwa razy. Jeśli kolejność musi być odwrotna — zapytanie z sekcji 7 trzeba napisać już pod docelowy model N:N, zakładając że materiał w danym podrozdziale to policzenie przez `MaterialSubchapter`, nawet jeśli fizycznie ta tabela jeszcze nie istnieje w momencie startu prac nad tym dokumentem (czyli: pisz kod pod model docelowy, nie pod aktualny, jeśli wiesz że `data-disk` wejdzie wcześniej lub w tym samym czasie).

---

## 3. Zakres (in / out of scope)

### W zakresie
1. Rejestrowanie wyświetlenia materiału przez ucznia (każde kliknięcie = +1, bez deduplikacji).
2. Widok ucznia: bez zmian wizualnych — rejestracja dzieje się "w tle" przy otwarciu materiału.
3. Widok nauczyciela: w ekranie "Zarządzaj widocznością" (per uczeń, per kurs) — przy każdym podrozdziale ikona oka + suma wyświetleń wszystkich materiałów w tym podrozdziale, **dla wybranego ucznia**.

### Poza zakresem (świadomie pomijamy)
- Zbiorcze statystyki wyświetleń **wszystkich** uczniów naraz (np. "średnia wyświetleń w klasie") — na razie widok jest zawsze filtrowany do jednego ucznia.
- Wyświetlenia per pojedynczy materiał w UI nauczyciela (specyfikacja pokazuje tylko sumę na poziomie podrozdziału) — jeśli w przyszłości potrzebny będzie drill-down do pojedynczego pliku, model danych to udźwignie (patrz sekcja 5), ale UI trzeba dobudować osobno.
- Deduplikacja wielokrotnych kliknięć w krótkim czasie (np. odświeżenie strony = kolejne +1) — patrz otwarte pytanie w sekcji 12.
- Zmiana logiki samej widoczności (`visibilityType` itd.) — to już istnieje i nie jest ruszane.

---

## 4. Wymagania funkcjonalne (user stories)

### 4.1 Rejestrowanie wyświetlenia (uczeń)
**Jako** uczeń, **chcę** otworzyć materiał w podrozdziale, **a system ma** zarejestrować to zdarzenie, **abym** nie musiał nic dodatkowo klikać — rejestracja jest transparentna.

Ścieżka:
`Moje Kursy → [Kurs] → [Rozdział] → [Podrozdział] → klik w materiał → +1 wyświetlenie dla tego materiału`

Każde kolejne kliknięcie w ten sam materiał, przez tego samego ucznia, **ponownie zwiększa licznik** (zgodnie ze specyfikacją: *"Klikając następny raz wyświetlenie nabija się ponownie"*).

### 4.2 Podgląd wyświetleń (nauczyciel)
**Jako** nauczyciel, **chcę** zobaczyć ile razy dany uczeń wyświetlił materiały w poszczególnych podrozdziałach, **aby** ocenić jego zaangażowanie.

Ścieżka:
`Dashboard → "Uczniowie" → wybór ucznia → "Zarządzaj widocznością" → wybór kursu → "Zarządzaj widocznością"`

Przy każdym podrozdziale: ikona oka 👁 + liczba = **suma wyświetleń wszystkich materiałów w tym podrozdziale, przez wybranego ucznia** (nie przez wszystkich uczniów łącznie).

Przykład ze specyfikacji: 3 pliki w podrozdziale, każdy wyświetlony raz przez danego ucznia → licznik pokazuje **3**.

---

## 5. Model danych — propozycja zmian w `schema.prisma`

Nowy, samodzielny model — nie modyfikuje istniejących tabel poza dodaniem relacji zwrotnych.

```prisma
model MaterialView {
  id          String   @id @default(cuid())
  materialId  String
  studentId   String
  viewedAt    DateTime @default(now())

  material    Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
  student     User     @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([materialId])
  @@index([studentId])
  @@index([materialId, studentId])
}
```

**Dlaczego log zdarzeń, a nie licznik (`viewCount: Int`) na `Material`:**
- Log (jeden wiersz = jedno kliknięcie) pozwala policzyć sumę **per uczeń** (wymóg z 4.2) bez dodatkowej tabeli pośredniej — przy prostym liczniku na `Material` nie dałoby się rozbić wyniku na poszczególnych uczniów.
- Zostawia furtkę na przyszłość: wykres w czasie, "ostatnio wyświetlone", ranking najpopularniejszych materiałów — bez zmiany schematu.
- Koszt: tabela rośnie z każdym kliknięciem. Przy realnych wolumenach (uczniowie klikający materiały) to nie powinno być problemem dla PostgreSQL, ale warto mieć to na uwadze przy planowaniu retencji danych (patrz sekcja 12).

**Alternatywa (lżejsza, do rozważenia jeśli log okaże się za ciężki):**
```prisma
model MaterialViewCount {
  materialId   String
  studentId    String
  count        Int      @default(1)
  lastViewedAt DateTime @default(now())

  @@id([materialId, studentId])
}
```
Zamiast `INSERT` przy każdym kliknięciu robisz `upsert` z `increment`. Traci się historię w czasie, ale zapytania agregujące są tańsze. **Decyzja do podjęcia przed implementacją** — patrz sekcja 12.

Dokument dalej zakłada wariant **log (`MaterialView`)** jako domyślny, bo daje więcej elastyczności przy tym samym poziomie trudności implementacji.

---

## 6. Endpointy API

Zgodnie z istniejącą konwencją namespace'ów (`/api/student/*`, `/api/teacher/*`).

### Nowe endpointy

| Metoda | Ścieżka | Opis | Autoryzacja |
|---|---|---|---|
| `POST` | `/api/student/materials/[materialId]/view` | Rejestruje jedno wyświetlenie materiału przez zalogowanego ucznia | `STUDENT` |

Request nie wymaga body — `studentId` bierzemy z sesji (`auth()`), `materialId` z URL.

```typescript
// src/app/api/student/materials/[materialId]/view/route.ts
export async function POST(req: Request, { params }: { params: { materialId: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    return new Response("Brak dostępu", { status: 403 });
  }

  await prisma.materialView.create({
    data: {
      materialId: params.materialId,
      studentId: session.user.id,
    },
  });

  return new Response(null, { status: 204 });
}
```

Endpoint powinien być wywoływany **fire-and-forget** z frontendu (nie blokować otwarcia materiału na odpowiedzi z backendu) — patrz sekcja 7 (UI).

### Istniejące endpointy — wymagane rozszerzenie

| Metoda | Ścieżka | Zmiana |
|---|---|---|
| `GET /api/teacher/students/[studentId]/courses/[courseId]/visibility` | Zarządzanie widocznością | Response musi zostać rozszerzony o pole `viewsCount` przy każdym podrozdziale — suma wyświetleń materiałów tego podrozdziału przez `studentId` z URL. |

Przykładowy kształt rozszerzonej odpowiedzi:

```jsonc
{
  "chapters": [
    {
      "id": "chapter_1",
      "title": "1. Liczby Rzeczywiste",
      "visible": true,
      "subchapters": [
        {
          "id": "subchapter_1",
          "title": "1.1 Pierwiastki i Potęgi",
          "visible": true,
          "viewsCount": 3   // ← NOWE pole
        }
      ]
    }
  ]
}
```

Zapytanie agregujące (przykład dla docelowego modelu N:N z `data-disk`, patrz sekcja 2):

```typescript
const views = await prisma.materialView.groupBy({
  by: ["materialId"],
  where: {
    studentId,
    material: {
      subchapters: { some: { subchapterId: { in: subchapterIds } } }, // przez MaterialSubchapter
    },
  },
  _count: { id: true },
});
// dalej: zmapować materialId -> subchapterId (przez MaterialSubchapter) i zsumować _count per subchapterId
```

> Jeśli `data-disk` **nie** jest jeszcze wdrożony i `Material` nadal ma bezpośrednie `subchapterId`, zapytanie upraszcza się do zwykłego `groupBy(["material.subchapterId"])` bez pośredniej tabeli — patrz tabela w sekcji 2.

---

## 7. Architektura UI

### Strona ucznia (rozszerzenie istniejącego widoku)
`src/app/dashboard/courses/[courseId]/chapters/[chapterId]/subchapters/[subchapterId]/page.tsx` (lub odpowiednik zgodny z realną strukturą routingu) — przy kliknięciu w materiał:

```typescript
"use client";

function handleMaterialClick(materialId: string) {
  // fire-and-forget — nie czekamy na odpowiedź, nie blokujemy UI
  fetch(`/api/student/materials/${materialId}/view`, { method: "POST" }).catch(() => {
    // celowo ciche niepowodzenie — brak zarejestrowanego wyświetlenia nie powinien
    // przeszkodzić uczniowi w obejrzeniu materiału
  });

  openMaterial(materialId); // istniejąca logika otwierania pliku/linku
}
```

### Strona nauczyciela — "Zarządzaj widocznością"
Rozszerzenie istniejącego komponentu listy podrozdziałów (widoczny na zrzucie ekranu w specyfikacji) o:
- ikonę oka (`Eye` z `lucide-react`) + liczbę wyświetleń, umieszczoną obok istniejącego przełącznika "Widoczny",
- brak dodatkowej interakcji (na razie tylko odczyt — bez drill-downu do pojedynczych materiałów, zgodnie z zakresem z sekcji 3).

```tsx
<div className="flex items-center gap-2">
  <Eye className="h-4 w-4 text-muted-foreground" />
  <span className="text-sm text-muted-foreground">{subchapter.viewsCount}</span>
</div>
```

---

## 8. Logika biznesowa — kluczowe reguły

1. **Każde kliknięcie = nowy wpis.** Brak deduplikacji w wersji podstawowej — zgodnie wprost ze specyfikacją.
2. **Licznik jest zawsze per uczeń.** Nauczyciel nigdy nie widzi zbiorczej sumy dla wszystkich uczniów naraz w tym widoku (bo wchodzi w kontekst konkretnego ucznia poprzez ścieżkę "Uczniowie → wybór ucznia").
3. **Rejestracja wyświetlenia nie zależy od widoczności podrozdziału.** Jeśli uczeń w ogóle widzi materiał (czyli podrozdział jest dla niego widoczny), może go otworzyć i wyświetlenie się liczy — logika widoczności i logika liczenia wyświetleń są od siebie niezależne.
4. **Błąd rejestracji wyświetlenia nie blokuje otwarcia materiału.** Priorytet ma doświadczenie ucznia — licznik to funkcja poboczna.
5. **Usunięcie materiału lub konta ucznia kasuje kaskadowo powiązane `MaterialView`** (`onDelete: Cascade`) — nie zostawiamy osieroconych wpisów.

---

## 9. Plan implementacji krok po kroku

1. **Baza danych**
   - [ ] Ustalić z zespołem kolejność względem `data-disk` (patrz sekcja 2) — potwierdzić, które zapytanie agregujące pisać.
   - [ ] Dodać model `MaterialView` (lub `MaterialViewCount` — decyzja z sekcji 5.1) w `schema.prisma`.
   - [ ] `npx prisma db push` na środowisku deweloperskim.
2. **Backend / API**
   - [ ] `POST /api/student/materials/[materialId]/view`.
   - [ ] Rozszerzenie `GET /api/teacher/students/[studentId]/courses/[courseId]/visibility` o `viewsCount`.
3. **UI — uczeń**
   - [ ] Fire-and-forget wywołanie przy kliknięciu materiału.
4. **UI — nauczyciel**
   - [ ] Ikona oka + licznik w widoku "Zarządzaj widocznością", przy każdym podrozdziale.
5. **QA i wdrożenie**
   - [ ] Testy z sekcji 10.
   - [ ] Code review + merge.
   - [ ] Deploy zgodnie z ustaloną kolejnością (najlepiej: migracja bazy → backend → UI, oddzielnymi wdrożeniami, jak ustalone w rozmowie o strategii release'owania).

---

## 10. Testowanie

- **Jednostkowe:** poprawność agregacji `viewsCount` per podrozdział (suma po materiałach, filtrowana po `studentId`).
- **Integracyjne (API):**
  - wielokrotne `POST .../view` dla tego samego materiału zwiększa licznik za każdym razem,
  - uczeń nie może zarejestrować wyświetlenia w imieniu innego ucznia (brak `studentId` w body — zawsze z sesji),
  - nauczyciel widzi poprawną sumę tylko dla wybranego ucznia, nie dla innych.
- **E2E:** pełna ścieżka — uczeń otwiera 3 różne materiały w podrozdziale → nauczyciel wchodzi w "Zarządzaj widocznością" dla tego ucznia → widzi licznik "3".
- **Przypadki brzegowe:**
  - materiał usunięty po zarejestrowaniu wyświetleń — czy kaskadowe usunięcie `MaterialView` nie psuje sumy dla pozostałych materiałów w podrozdziale,
  - podrozdział bez żadnych materiałów — licznik powinien pokazywać `0`, nie błąd.

---

## 11. Bezpieczeństwo i uprawnienia

- `POST /api/student/materials/[materialId]/view` dostępny wyłącznie dla roli `STUDENT`, `studentId` zawsze z `session`, nigdy z body/query (żeby uczeń nie mógł "nabijać" wyświetleń w imieniu kogoś innego).
- `GET .../visibility` z rozszerzonym `viewsCount` — dostępny wyłącznie dla nauczyciela będącego właścicielem kursu (`Course.teacherId === session.user.id`), zgodnie z regułą już stosowaną w tym endpointcie.

---

## 12. Otwarte pytania i ryzyka

- ❓ **Deduplikacja:** czy odświeżenie strony z otwartym materiałem (np. PDF w viewerze) ma liczyć się jako nowe wyświetlenie? Specyfikacja mówi wprost, że kolejne kliknięcie = kolejne wyświetlenie, ale warto potwierdzić, czy "kliknięcie" = tylko świadome otwarcie z listy, czy też każde odświeżenie/powrót do widoku.
- ❓ **Retencja danych:** czy `MaterialView` (wariant log) ma rosnąć bezterminowo, czy warto od razu zaplanować politykę czyszczenia/agregacji starych wpisów (np. po semestrze)?
- ❓ **Log vs licznik (sekcja 5):** ostateczna decyzja przed implementacją — log daje elastyczność (historia w czasie), licznik jest tańszy. Rekomenduję log, chyba że skala uczniów/materiałów jest na tyle duża, że koszt storage/zapytań stanie się problemem.
- ⚠️ **Zależność od `data-disk`:** jeśli oba featury będą w trakcie prac równolegle, zapytanie agregujące w sekcji 6 może wymagać przepisania w zależności od tego, który feature wejdzie na produkcję pierwszy — ustalić kolejność wdrożeń **przed** startem prac backendowych nad tym ficzerem.

---

## 13. Definicja ukończenia (Definition of Done)

- [ ] Model `MaterialView` (lub wariant licznikowy) zaaplikowany migracją bez wpływu na istniejące dane.
- [ ] `POST /api/student/materials/[materialId]/view` działa i jest wywoływany przy każdym otwarciu materiału przez ucznia.
- [ ] `GET .../visibility` zwraca poprawny `viewsCount` per podrozdział, per wybrany uczeń.
- [ ] UI nauczyciela pokazuje ikonę oka + liczbę zgodnie ze zrzutem ekranu ze specyfikacji.
- [ ] Rejestracja wyświetlenia nie blokuje ani nie spowalnia odczuwalnie otwierania materiału przez ucznia.
- [ ] Reguły uprawnień (sekcja 11) pokryte testami.
- [ ] Ustalona i udokumentowana kolejność wdrożenia względem `data-disk`.
