# [cite_start]Mathify - Aplikacja do śledzenia rozwoju matematycznego [cite: 1]

---

## [cite_start]1. Wstęp [cite: 2]

### 1.1. [cite_start]Opis Aplikacji [cite: 3]

- [cite_start]Aplikacja służy jako element śledzenia rozwoju i postępu matematycznego uczniów[cite: 4].
- [cite_start]Uczeń może korzystać z materiałów udostępnianych przez nauczyciela oraz przesyłać własne pliki z rozwiązanymi zadaniami maturalnymi[cite: 5].
- [cite_start]Nauczyciele mogą tworzyć własne kursy i dodawać do nich uczniów w sposób dla nich anonimowy (uczniowie nie widzą się nawzajem)[cite: 6].
- [cite_start]Kursy składają się z rozdziałów i podrozdziałów, a nauczyciel może ręcznie lub automatycznie ustawiać widoczność poszczególnych elementów dla konkretnych uczniów[cite: 7, 58].
- [cite_start]Uczniowie mogą przesyłać pliki do podrozdziałów, jeśli nauczyciel odblokuje taką możliwość[cite: 8].

#### [cite_start]Automatyczne sprawdzanie prac [cite: 9]

- [cite_start]Prace domowe są wysyłane bezpośrednio do AI (np. Gemini), które sprawdza zadania i generuje szczegółowe wyniki[cite: 10].
- [cite_start]Wyniki są weryfikowane i potwierdzane przez nauczyciela przed wysłaniem ich do ucznia[cite: 10, 11].
- [cite_start]Uczeń ma dostęp do panelu ze statystykami dotyczącymi jego pracy[cite: 12].

### 1.2. [cite_start]Powód realizacji [cite: 13]

- [cite_start]Głównym powodem jest zwiększenie optymalności pracy nauczyciela[cite: 14].
- [cite_start]System zastępuje przesyłanie prac przez komunikatory (np. Messenger) i pozwala na automatyzację harmonogramu udostępniania materiałów[cite: 14].
- [cite_start]Projekt usprawnia proces sprawdzania prac domowych[cite: 15].

### 1.3. [cite_start]Główny cel projektu [cite: 16]

- [cite_start]Ułatwienie pracy nauczyciela oraz usprawnienie wymiany informacji na linii uczeń – nauczyciel[cite: 17].

---

## [cite_start]2. Cel projektu [cite: 18]

### 2.1. [cite_start]Główny cel [cite: 19]

- [cite_start]Stworzenie systemu obsługującego relacje nauczyciel – uczeń, w tym udostępnianie materiałów i weryfikację prac przez AI[cite: 20, 21].

### 2.2. [cite_start]Cele szczegółowe [cite: 22]

- [cite_start]**Admin**: Posiada pełne uprawnienia do zarządzania kontami nauczycieli i uczniów (tworzenie, usuwanie, edycja)[cite: 24, 25, 26].
- [cite_start]**Nauczyciel**: Tworzy kursy (materiały zewnętrzne), zarządza uczestnikami, weryfikuje poprawki AI i odsyła wyniki z opisem błędów[cite: 28, 29, 32].
- [cite_start]**Uczeń**: Korzysta z udostępnionych materiałów, wysyła prace domowe w odblokowanych sekcjach i śledzi własne postępy[cite: 33, 34, 35].

---

## [cite_start]3. Zakres projektu [cite: 36]

### 3.1. [cite_start]System logowania i rejestracji [cite: 37, 40]

- [cite_start]Dostęp do kursów wymaga zalogowania za pomocą loginu i hasła[cite: 38].
- [cite_start]Użytkownik niezalogowany widzi jedynie stronę tytułową[cite: 39].
- [cite_start]Rejestracja jest dostępna dla wszystkich, ale wymaga zatwierdzenia roli (uczeń/nauczyciel) przez Admina[cite: 41, 42].
- [cite_start]Admin oraz Nauczyciel mogą tworzyć konta użytkowników bez konieczności dodatkowego potwierdzania[cite: 44, 45].
- [cite_start]Wymagane dane przy rejestracji: Imię, Nazwisko, Login, Hasło, E-mail, Rola użytkownika[cite: 46, 47, 48, 49, 50, 51, 52].

### 3.2. [cite_start]Zarządzanie kursami i AI [cite: 54, 61]

- [cite_start]Nauczyciel zarządza strukturą kursu (rozdziały, podrozdziały) i widocznością dla konkretnych osób[cite: 55, 56].
- [cite_start]AI przyjmuje pliki (początkowo PDF) i generuje odpowiedź w formacie JSON[cite: 63, 67, 68].
- [cite_start]**Struktura JSON**: `{[id, id_pracy_domowej, zadanie, ilość punktów zdobytych, maksymalna ilość punktów, komentarz]}`[cite: 65, 66].

### 3.3. [cite_start]Śledzenie postępów [cite: 69]

- [cite_start]Po zatwierdzeniu wyników przez nauczyciela, uczeń otrzymuje powiadomienie, a dane są zapisywane w systemie[cite: 70].
- [cite_start]System generuje wykresy słupkowe (oś pionowa: procenty, oś pozioma: temat/dział)[cite: 71, 72].
- [cite_start]Uczeń może sprawdzić szczegóły każdego zadania (punkty, komentarze przy błędach)[cite: 73, 74, 75].

---

## [cite_start]4. Grupa docelowa [cite: 80]

- [cite_start]Osoby prowadzące korepetycje lub inne zajęcia dydaktyczne[cite: 81].
- [cite_start]Nauczyciele potrzebujący narzędzia do zarządzania wieloma kursami i uczniami[cite: 83].

---

## [cite_start]5. Wymagania [cite: 85, 93]

### Funkcjonalne

- [cite_start]Logowanie, rejestracja i zatwierdzanie kont przez Admina[cite: 86].
- [cite_start]Zapisywanie wyników w bazie danych i generowanie wykresów[cite: 88, 90].
- [cite_start]Automatyczne sprawdzanie prac przez AI[cite: 89].
- [cite_start]Zarządzanie strukturą kursów i uprawnieniami do plików[cite: 91, 92].

### Niefunkcjonalne

- [cite_start]Responsywny interfejs[cite: 94].
- [cite_start]Intuicyjna obsługa i nowoczesny wygląd[cite: 95, 96].

---

## [cite_start]6. Narzędzia i Technologie [cite: 97]

- [cite_start]**Frontend**: React & Next[cite: 98, 99].
- [cite_start]**Backend**: Next[cite: 100, 101].
- [cite_start]**Baza Danych**: PostgreSQL[cite: 102, 103].
- [cite_start]**Inne**: Git (kontrola wersji)[cite: 104, 105].
