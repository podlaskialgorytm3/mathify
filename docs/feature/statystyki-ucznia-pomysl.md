# Pomysł: Rozbudowane statystyki ucznia z prac domowych

**Projekt:** Mathify
**Feature (roboczo):** `student-analytics`
**Status:** Pomysł / draft do dyskusji
**Data:** 2026-08-31

---

## 1. Po co to robić

Dzisiaj uczeń widzi **ile** dostał punktów. Nie widzi **dlaczego**, **na czym konkretnie traci** i **czy się poprawia**. Wynik 72% nic nie mówi — dopiero informacja „w zadaniach z przekształceń wzorów tracisz średnio 40% punktów, a w rachunkach na ułamkach masz 95%" zmienia zachowanie ucznia.

Cel: zamienić panel statystyk z **tabeli wyników** w **narzędzie diagnostyczne**, które odpowiada na trzy pytania:

1. **Gdzie jestem słaby?** (diagnoza tematyczna)
2. **Czy się poprawiam?** (trend w czasie)
3. **Co mam zrobić dalej?** (konkretna rekomendacja)

---

## 2. Co już mamy (punkt wyjścia)

Strona `src/app/dashboard/student/statistics/page.tsx` liczy dziś po stronie klienta z `/api/student/submissions`:

- liczba prac (wszystkie / sprawdzone),
- średni procent punktów,
- najlepszy i najsłabszy wynik,
- wykres słupkowy: % za każdą pracę,
- wykres liniowy: trend postępu.

**Kluczowa obserwacja:** w bazie leży dużo więcej, niż pokazujemy. Model `Task` ma **rozbicie na pojedyncze zadania** (`taskNumber`, `pointsEarned`, `maxPoints`, `comment`, `teacherComment`, `teacherEdited`), a mimo to całą pracę spłaszczamy do jednej liczby. To jest największa niewykorzystana wartość w projekcie.

Dostępne, a nietknięte źródła sygnału:

| Źródło                                              | Co z tego wyciągamy                                      |
| --------------------------------------------------- | -------------------------------------------------------- |
| `Task.taskNumber` + `pointsEarned` / `maxPoints`     | profil mocnych/słabych zadań, nie tylko średnia pracy     |
| `Task.comment` (AI) / `Task.teacherComment`          | najczęstsze typy błędów, powtarzalne pomyłki              |
| `Task.teacherEdited`                                 | jak często nauczyciel koryguje AI (zaufanie do oceny)     |
| `Submission.submittedAt` vs `SubmissionReview.reviewedAt` | rytm pracy ucznia i czas oczekiwania na feedback      |
| `Subchapter` → `Chapter` → `Course`                  | agregacja tematyczna (per rozdział = per dział materiału) |
| `MaterialView`                                       | czy uczeń oglądał materiał **przed** oddaniem pracy       |
| `CourseEnrollment`                                   | anonimowe porównanie do grupy (percentyl, nie ranking)    |

Wniosek: **większość poniższych statystyk da się policzyć bez żadnej migracji bazy.**

---

## 3. Propozycja: co konkretnie dodać

### 3.1 Mapa mocnych i słabych stron (rdzeń pomysłu) ⭐

Agregacja **per rozdział** (`Chapter`), a nie per praca:

```
Rozdział „Funkcje kwadratowe"      ██████████░░░░░░░░░░  52%   (8 zadań)
Rozdział „Ułamki i procenty"       ███████████████████░  94%   (14 zadań)
Rozdział „Geometria analityczna"   █████████████░░░░░░░  67%   (6 zadań)
```

Wizualizacja: **wykres radarowy** (Chart.js `radar` — biblioteka już w projekcie) + lista posortowana rosnąco po skuteczności. Uczeń od razu widzi, że problem nie jest „z matmy", tylko z jednym konkretnym działem.

**Ważny detal:** obok procentu pokazujemy liczbę zadań, na której liczono wynik. 40% z dwóch zadań to nie jest diagnoza, to szum — takie pozycje oznaczamy jako „za mało danych".

### 3.2 Profil „zadanie po zadaniu" w obrębie pracy

Uczniowie mają powtarzalne wzorce: pierwsze zadania robią dobrze, na ostatnich się poddają (albo im brakuje czasu). Wykres średniej skuteczności wg `taskNumber` w całym kursie natychmiast to ujawnia:

```
Zadanie 1: 91%   Zadanie 2: 88%   Zadanie 3: 74%   Zadanie 4: 51%   Zadanie 5: 38%
```

Jeśli krzywa opada — komunikat: _„Tracisz punkty głównie w końcówce pracy. Spróbuj zaczynać od zadań, które wyglądają najtrudniej."_ To jest wniosek, którego nie da się zobaczyć w obecnym panelu w żaden sposób.

### 3.3 Trend z linią regresji i średnią kroczącą

Obecny wykres trendu skacze — jedna słaba praca psuje obraz. Dodajemy:

- **średnią kroczącą z 3 ostatnich prac** (wygładza szum),
- **linię trendu** (prosta regresja liniowa) z jednym zdaniem podsumowania: _„Twoje wyniki rosną średnio o 4 p.p. na pracę"_ albo _„Wyniki utrzymują się na stałym poziomie"_,
- podział wykresu kolorem na kursy, jeśli uczeń ma ich kilka.

### 3.4 Anonimowe porównanie do grupy (percentyl)

Dla każdego rozdziału: _„Twój wynik: 67%. Średnia grupy: 71%. Jesteś w 40. percentylu."_

**Zasady, bez których tego nie robimy:**

- nigdy nie pokazujemy nazwisk ani rankingu — tylko własną pozycję na tle anonimowego rozkładu,
- ukrywamy statystykę, gdy w grupie jest **mniej niż 5 uczniów** z oddaną pracą (inaczej „średnia grupy" = konkretna osoba, którą da się zidentyfikować),
- nauczyciel może wyłączyć porównania dla kursu (flaga w ustawieniach kursu) — nie każda klasa dobrze na to reaguje.

### 3.5 Wpływ oglądania materiałów na wynik ⭐

Mamy `MaterialView` i mamy datę oddania pracy. Da się policzyć rzecz, która przekonuje uczniów mocniej niż jakiekolwiek kazanie:

> „Prace oddane po obejrzeniu materiałów z podrozdziału: **średnio 84%**.
> Prace oddane bez otwarcia materiałów: **średnio 61%**."

To jest korelacja, nie przyczynowość — i tak to formułujemy w UI („uczniowie, którzy…", nie „obejrzenie materiału podnosi wynik o 23 p.p."). Ale jako sygnał zwrotny działa świetnie.

### 3.6 Najczęstsze typy błędów (z komentarzy AI)

`Task.comment` zawiera opis błędu wygenerowany przez Gemini. Zamiast pokazywać 40 osobnych komentarzy, **grupujemy je w kategorie** i pokazujemy top 3:

```
1. Błędy rachunkowe na ułamkach        — 9 wystąpień
2. Pominięta dziedzina funkcji          — 6 wystąpień
3. Błędne przekształcenie wzoru         — 4 wystąpienia
```

Realizacja (dwa warianty, do wyboru):

- **Tani:** dopisanie do istniejącego promptu AI prośby o zwrócenie `errorCategory` z zamkniętej listy kategorii przy każdym zadaniu — jedna zmiana w prompcie, kategoria leci do nowej kolumny w `Task`.
- **Drogi:** osobne wywołanie AI podsumowujące wszystkie komentarze ucznia. Więcej tokenów, więcej opóźnienia — odradzam na start.

### 3.7 Regularność i rytm pracy

- **Heatmapa kalendarzowa** (styl GitHub contributions) — kiedy uczeń oddaje prace.
- **Passa** — ile prac z rzędu oddanych i sprawdzonych bez przerwy.
- **Czas oddania** — czy uczeń oddaje pracę zaraz po udostępnieniu podrozdziału, czy tuż przed końcem (`Subchapter.visibleUntilDate` jest już w schemacie).

Uwaga: to są miary **motywacyjne**, nie oceniające. Nie wolno z nich robić „kar" ani mieszać ich do średniej wyników.

### 3.8 Karta „Co dalej?" — rekomendacja zamiast liczby

Podsumowanie każdej sekcji jednym konkretnym działaniem:

> **Twój najsłabszy dział: „Funkcje kwadratowe" (52%)**
> Najczęstszy błąd: wyznaczanie miejsc zerowych.
> 👉 Wróć do materiałów: _„Postać kanoniczna"_, _„Delta i miejsca zerowe"_ (linki do podrozdziałów)

To spina całość: diagnoza → przyczyna → konkretny link. Bez tego statystyki są tylko ładne.

---

## 4. Model danych — co wymaga zmian

**Bez migracji (~80% powyższego):** 3.1, 3.2, 3.3, 3.4, 3.5, 3.7 — wszystko liczone z istniejących tabel.

**Wymaga drobnych zmian:**

| Zmiana                                              | Po co                                        | Koszt                    |
| --------------------------------------------------- | -------------------------------------------- | ------------------------ |
| `Task.errorCategory String?`                        | grupowanie błędów (3.6)                      | 1 kolumna + zmiana promptu |
| `Course.allowPeerComparison Boolean @default(true)` | wyłączanie porównań do grupy (3.4)           | 1 kolumna                |
| Tabela cache'u agregatów (opcjonalnie)              | wydajność przy dużej liczbie prac            | do rozważenia później    |

**Świadomie odrzucone:** osobny model „umiejętności/tagów" przypinanych do zadań. Brzmi kusząco, ale wymaga, żeby nauczyciel ręcznie tagował każde zadanie — a tego nikt nie będzie robił. Rozdział jako jednostka tematyczna jest „wystarczająco dobry" i darmowy.

---

## 5. Architektura (szkic)

### Backend

Kluczowa decyzja: **liczymy na serwerze, nie w przeglądarce.** Obecna strona ściąga wszystkie zgłoszenia i liczy w `calculateStats()` po stronie klienta — przy 200 pracach i rozbiciu na zadania to przestanie być akceptowalne.

```
GET /api/student/statistics/overview        → KPI + trend + regresja
GET /api/student/statistics/by-chapter      → radar / mapa mocnych i słabych stron
GET /api/student/statistics/by-task-number  → profil „zadanie po zadaniu"
GET /api/student/statistics/errors          → top kategorie błędów
GET /api/student/statistics/activity        → heatmapa + passa
GET /api/student/statistics/recommendations → karta „Co dalej?"
```

Wszystkie z filtrem `?courseId=` (uczeń bywa w kilku kursach — mieszanie ich w jedną średnią jest bez sensu) i `?range=` (ostatnie 30/90 dni / całość).

Auth: `role === "STUDENT"`, dane **zawsze** zawężone do `session.user.id`. Endpointy statystyk nie mogą przyjmować `studentId` z query — to prosta droga do wycieku wyników innych uczniów.

### Frontend

```
src/app/dashboard/student/statistics/page.tsx     ← zakładki zamiast jednej listy
src/components/student-statistics/
├── stats-kpi-row.tsx           (kafelki: średnia, trend, passa, percentyl)
├── strengths-radar.tsx         (radar per rozdział)
├── weakness-list.tsx           (lista działów + „za mało danych")
├── task-position-chart.tsx     (skuteczność wg numeru zadania)
├── progress-trend-chart.tsx    (trend + średnia krocząca + regresja)
├── error-categories.tsx        (top typy błędów)
├── activity-heatmap.tsx        (kalendarz)
└── next-steps-card.tsx         (rekomendacja + linki do podrozdziałów)
```

Chart.js + react-chartjs-2 są już w `package.json` — radar i line wychodzą bez nowej zależności. Heatmapę kalendarzową robimy własnym gridem CSS (biblioteki do tego są ciężkie i nadmiarowe).

---

## 6. Kolejność wdrożenia

| Faza | Zakres                                                     | Dlaczego w tej kolejności                              |
| ---- | ---------------------------------------------------------- | ------------------------------------------------------ |
| 1    | Przeniesienie liczenia na serwer + endpoint `overview`      | fundament; bez tego reszta dokłada się do wolnej strony |
| 2    | Mapa mocnych/słabych stron (3.1) + karta „Co dalej?" (3.8)  | największa wartość na jednostkę pracy                   |
| 3    | Trend z regresją (3.3) + profil wg numeru zadania (3.2)     | czysta analityka na istniejących danych                 |
| 4    | Wpływ materiałów (3.5) + heatmapa i passa (3.7)             | „miłe dodatki", mocno motywacyjne                       |
| 5    | Kategorie błędów (3.6) — wymaga zmiany promptu AI + kolumny | jedyna faza dotykająca AI i schematu                    |
| 6    | Porównanie do grupy (3.4)                                   | najbardziej wrażliwe społecznie — na końcu, świadomie   |

---

## 7. Ryzyka i rzeczy, o które trzeba się potknąć świadomie

- ⚠️ **Mała próbka kłamie.** Procent z 1–2 zadań to nie diagnoza. Wszędzie próg minimalnej liczby zadań, inaczej panel będzie generował fałszywe „słabe strony".
- ⚠️ **Demotywacja.** Uczeń, który we wszystkim ma 45%, zobaczy sześć czerwonych wykresów naraz. Język komunikatów musi być rozwojowy („tu jest największy potencjał do zysku"), a paleta kolorów stonowana — bez ściany czerwieni.
- ⚠️ **Prywatność w małych grupach.** Punkt 3.4 bez progu 5 uczniów faktycznie ujawnia cudze wyniki. To nie jest teoretyczne ryzyko przy klasie liczącej 6 osób.
- ⚠️ **Wydajność.** Agregaty per zadanie po wszystkich pracach ucznia to sporo joinów. Zaczynamy od zwykłych zapytań Prisma z `groupBy`, mierzymy, i dopiero potem myślimy o cache'u — nie odwrotnie.
- ⚠️ **AI bywa niesprawiedliwe.** Statystyki liczymy z **finalnych** punktów (po korekcie nauczyciela, `teacherEdited`). Budowanie diagnozy na niezweryfikowanych ocenach AI to budowanie na piasku.
- ❓ **Otwarte pytanie:** czy nauczyciel dostaje ten sam zestaw statystyk w widoku ucznia (`/dashboard/teacher/students/[studentId]`)? Technicznie to te same endpointy z innym zakresem uprawnień — kusząco tanie, ale trzeba to świadomie zaplanować, a nie dokleić przypadkiem.

---

## 8. Jak poznamy, że się udało

- Uczeń po wejściu w statystyki potrafi **wskazać swój najsłabszy dział** i **kliknąć w materiał**, który ma z nim związek — bez pytania nauczyciela.
- Rekomendacja z karty „Co dalej?" prowadzi do realnego kliknięcia w podrozdział (mierzalne przez `MaterialView`).
- Żadna statystyka nie pokazuje się na próbce mniejszej niż próg minimalny — panel nigdy nie kłamie „z rozpędu".
- Czas odpowiedzi endpointów statystyk poniżej ~500 ms dla ucznia z 100 pracami.
