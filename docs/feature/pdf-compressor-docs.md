# Dokumentacja implementacyjna — Kompresor PDF

## 1. Cel projektu

Celem funkcjonalności **Kompresor PDF** jest umożliwienie uczniowi przesłania pracy domowej w formacie PDF bez konieczności ręcznego zmniejszania pliku przed wysłaniem.

Podstawowa zasada działania:

1. Uczeń wybiera kurs.
2. Uczeń wybiera opcję **„Prześlij pracę domową”**.
3. Uczeń wybiera plik PDF i pozostawia/ustawia sposób przesłania jako **PDF**.
4. Aplikacja sprawdza rozmiar pliku po stronie frontendu.
5. Jeżeli plik ma **nie więcej niż 3 MB**, może zostać od razu wysłany na serwer.
6. Jeżeli plik przekracza **3 MB**, frontend automatycznie podejmuje próbę jego kompresji.
7. Po każdej kompresji rozmiar pliku jest sprawdzany ponownie.
8. Jeżeli plik osiągnie rozmiar poniżej 3 MB, zostaje przesłany na serwer.
9. Jeżeli po maksymalnie **3 iteracjach** nadal nie uda się uzyskać wymaganego rozmiaru, użytkownik otrzymuje komunikat:

> „Twój plik jest za duży - system próbował go skompresować, lecz jest niemożliwe”.

10. Jeżeli mimo prawidłowego przygotowania pliku nie będzie możliwe przesłanie go na serwer z powodu ograniczeń hostingu/infrastruktury, użytkownik powinien otrzymać dodatkową informację z możliwością skorzystania z zewnętrznego narzędzia do kompresji PDF.

Założenia dotyczące progu 3 MB, maksymalnie trzech prób oraz komunikatów wynikają bezpośrednio z opisu funkcjonalności. fileciteturn0file0L2-L19

---

## 2. Zakres funkcjonalności

### 2.1. Funkcjonalność obejmuje

- obsługę przesyłania plików PDF,
- sprawdzenie rozmiaru pliku przed wysłaniem,
- automatyczną kompresję po stronie frontendu,
- ponowne sprawdzanie rozmiaru po kompresji,
- maksymalnie trzy iteracje kompresji,
- przesłanie poprawnego pliku na serwer,
- obsługę przypadku, w którym PDF nie może zostać wystarczająco zmniejszony,
- obsługę błędu wysyłania pliku na serwer,
- komunikaty informujące użytkownika o aktualnym stanie operacji.

### 2.2. Funkcjonalność nie obejmuje

Na podstawie dostarczonego opisu nie należy zakładać dodatkowych funkcji, takich jak:

- kompresja plików innych niż PDF,
- ręczny wybór poziomu kompresji,
- przechowywanie wielu wersji skompresowanego pliku,
- kompresja po stronie backendu,
- automatyczne wysyłanie pliku do zewnętrznego serwisu,
- edycja zawartości dokumentu PDF.

Jeżeli któraś z tych funkcji ma zostać dodana, powinna być potraktowana jako osobne rozszerzenie.

---

# 3. Kontekst funkcjonalny

Funkcja jest częścią procesu przesyłania pracy domowej.

Na podstawie dostarczonego projektu proces użytkownika wygląda następująco:

```text
Uczeń
  |
  v
Wybór kursu
  |
  v
„Prześlij pracę domową”
  |
  v
Wybór sposobu przesłania
  |
  v
Wybór „Plik PDF”
  |
  v
Wybór pliku
  |
  v
Kliknięcie „Prześlij pracę”
  |
  v
Sprawdzenie rozmiaru
  |
  +-----------------------------+
  |                             |
  | <= 3 MB                     | > 3 MB
  v                             v
Wysyłka na serwer          Kompresja PDF
                                |
                                v
                         Ponowne sprawdzenie
                                |
                   +------------+------------+
                   |                         |
                 < 3 MB                    >= 3 MB
                   |                         |
                   v                         v
             Wysyłka na serwer        Kolejna iteracja
                                             |
                                             v
                                      Maksymalnie 3 próby
                                             |
                                      +------+------+
                                      |             |
                                  sukces        brak sukcesu
                                      |             |
                                      v             v
                                  wysyłka       komunikat
```

---

# 4. Widok użytkownika

Na podstawie makiety znajdującej się w dostarczonym dokumencie użytkownik znajduje się na ekranie **„Prześlij pracę domową”**.

Na ekranie widoczne są m.in.:

- przycisk powrotu,
- nazwa ekranu „Prześlij pracę domową”,
- wybór sposobu przesłania,
- opcja **„Plik PDF”**,
- możliwość wyboru pliku,
- informacja o maksymalnym rozmiarze widoczna przy polu uploadu,
- przycisk **„Prześlij pracę”**,
- przycisk **„Anuluj”**,
- sekcja **„Ważne informacje”**.

Makieta pokazuje również informację, że użytkownik może przesłać jeden plik PDF z pracą domową.

Opis kroków 1–3 znajduje się na stronie 1 dokumentu, natomiast ekran przesyłania pliku i krok 4 pokazano na stronie 2. fileciteturn0file0L20-L29

---

# 5. Najważniejsza reguła biznesowa

## Limit 3 MB

Limit, który musi zostać spełniony przed przesłaniem pliku, wynosi:

```text
3 MB
```

Dla implementacji należy ustalić jedną reprezentację limitu w kodzie.

Przykładowo:

```ts
const MAX_PDF_SIZE_BYTES = 3 * 1024 * 1024;
```

Należy jednak uzgodnić z istniejącym backendem, czy „3 MB” jest interpretowane jako:

- `3 * 1024 * 1024` bajtów,
- czy `3 * 1000 * 1000` bajtów.

Ważne jest, aby frontend i backend stosowały tę samą definicję limitu.

---

# 6. Architektura rozwiązania

## 6.1. Główna decyzja

Kompresja ma odbywać się **po stronie frontendu**.

Oznacza to, że:

```text
Użytkownik
   |
   v
Frontend
   |
   +--> sprawdzenie rozmiaru
   |
   +--> kompresja PDF
   |
   +--> ponowne sprawdzenie
   |
   v
Backend / API
   |
   v
Przechowywanie pliku
```

Backend nie powinien być odpowiedzialny za wykonywanie kompresji, jeżeli celem jest zachowanie założenia opisanego w projekcie.

---

# 7. Dlaczego kompresja powinna odbywać się przed wysłaniem?

Jeżeli plik ma np. 8 MB, a backend/hosting akceptuje maksymalnie 3 MB, wysłanie oryginalnego pliku może zakończyć się błędem jeszcze przed wykonaniem właściwej logiki aplikacji.

Dlatego:

```text
zły przepływ:

PDF 8 MB
   |
   v
Backend
   |
   X
odrzucony plik
```

Powinno być:

```text
PDF 8 MB
   |
   v
Frontend
   |
   v
Kompresja
   |
   v
PDF 2.8 MB
   |
   v
Backend
   |
   v
sukces
```

Dzięki temu aplikacja może wykorzystać limit infrastruktury w sposób przewidywalny.

---

# 8. Algorytm działania

## 8.1. Algorytm wysokiego poziomu

```text
START

Pobierz plik wybrany przez użytkownika

Czy plik jest PDF?
    NIE -> pokaż błąd
    TAK -> kontynuuj

Sprawdź rozmiar

Czy rozmiar <= 3 MB?
    TAK -> prześlij plik
    NIE -> rozpocznij kompresję

Ustaw licznik iteracji = 1

WHILE licznik <= 3:

    skompresuj PDF

    sprawdź rozmiar

    JEŻELI rozmiar <= 3 MB:
        prześlij plik
        zakończ

    W PRZECIWNYM RAZIE:
        zwiększ licznik

Po 3 nieudanych próbach:

    pokaż komunikat:
    „Twój plik jest za duży - system próbował go
    skompresować, lecz jest niemożliwe”.

END
```

---

# 9. Szczegółowy algorytm

Pseudokod:

```text
function processPdf(file):

    validatePdf(file)

    if file.size <= MAX_SIZE:
        upload(file)
        return

    compressedFile = file

    for attempt from 1 to 3:

        compressedFile = compressPdf(compressedFile)

        if compressedFile.size <= MAX_SIZE:
            upload(compressedFile)
            return

    showCompressionFailure()
```

Ważne: do kolejnej iteracji należy przekazywać **wynik poprzedniej kompresji**, a nie za każdym razem oryginalny plik.

Czyli:

```text
oryginał
   |
   v
kompresja #1
   |
   v
wynik #1
   |
   v
kompresja #2
   |
   v
wynik #2
   |
   v
kompresja #3
   |
   v
wynik #3
```

a nie:

```text
oryginał ---> kompresja #1
oryginał ---> kompresja #2
oryginał ---> kompresja #3
```

---

# 10. Warunki zakończenia

Operacja może zakończyć się na kilka sposobów.

## 10.1. Plik od początku jest poprawny

Przykład:

```text
plik: 2.4 MB
limit: 3 MB
```

Wynik:

```text
plik -> upload
```

Nie wykonujemy żadnej kompresji.

---

## 10.2. Sukces po pierwszej kompresji

```text
oryginał: 5.2 MB

kompresja #1
     |
     v
2.7 MB
```

Wynik:

```text
upload 2.7 MB
```

---

## 10.3. Sukces po drugiej kompresji

```text
oryginał: 7.1 MB

kompresja #1 -> 5.0 MB
kompresja #2 -> 2.9 MB
```

Wynik:

```text
upload 2.9 MB
```

---

## 10.4. Sukces po trzeciej kompresji

```text
oryginał: 10 MB

kompresja #1 -> 7.0 MB
kompresja #2 -> 4.8 MB
kompresja #3 -> 2.9 MB
```

Wynik:

```text
upload 2.9 MB
```

---

## 10.5. Brak możliwości wystarczającej kompresji

Przykład:

```text
oryginał: 10 MB

kompresja #1 -> 8.1 MB
kompresja #2 -> 7.9 MB
kompresja #3 -> 7.8 MB
```

Wynik:

```text
UPLOAD NIE JEST WYKONYWANY

komunikat:
„Twój plik jest za duży - system próbował go
skompresować, lecz jest niemożliwe”.
```

Treść komunikatu wynika bezpośrednio z dokumentacji funkcjonalności. fileciteturn0file0L9-L12

---

# 11. Kompresja PDF

## 11.1. Wybór biblioteki

Dokument źródłowy określa, że kompresja ma odbywać się na frontendzie, ale **nie wskazuje konkretnej biblioteki**.

Dlatego wybór technologii powinien być osobną decyzją techniczną.

Biblioteka powinna spełniać następujące wymagania:

- działać w przeglądarce,
- przyjmować PDF jako `File`/`Blob` lub umożliwiać łatwe przejście z `File`,
- zwracać wynik jako `Blob`/`File`,
- nie wymagać wysyłania dokumentu do zewnętrznego API,
- umożliwiać wielokrotne przetwarzanie dokumentu,
- działać w środowisku używanym przez aplikację.

### Rekomendacja

Przed implementacją należy wykonać PoC na kilku typach PDF:

1. PDF zawierający głównie tekst.
2. PDF zawierający zdjęcia.
3. PDF będący skanem.
4. PDF zawierający wiele stron.
5. PDF już wcześniej skompresowany.

Celem PoC jest sprawdzenie, czy wybrana biblioteka faktycznie pozwala osiągnąć wymagany poziom kompresji.

---

# 12. Ważne ograniczenie kompresji

Nie każdy PDF można znacząco zmniejszyć.

Przykładowo:

```text
PDF zawierający dużo tekstu
        |
        v
może zostać mocno zmniejszony
```

Natomiast:

```text
PDF zawierający wysokiej jakości skany
        |
        v
kompresja może dać niewielki efekt
```

Dlatego aplikacja nie może zakładać, że:

```text
kompresja = zawsze plik < 3 MB
```

Algorytm musi obsługiwać sytuację, w której po trzech próbach plik nadal jest za duży.

---

# 13. Iteracje kompresji

## 13.1. Maksymalna liczba prób

Maksymalna liczba prób:

```text
3
```

Nie należy wykonywać nieskończonej pętli:

```ts
while (file.size > MAX_SIZE) {
    file = await compress(file);
}
```

Takie rozwiązanie jest niebezpieczne, ponieważ:

- może trwać bardzo długo,
- może zawiesić UI,
- może powodować duże zużycie pamięci,
- może doprowadzić do wielokrotnej utraty jakości dokumentu.

Zamiast tego:

```ts
for (let attempt = 1; attempt <= 3; attempt++) {
    // compression
}
```

---

# 14. Stan procesu

Warto reprezentować proces wysyłania jako jawny stan.

Przykładowo:

```ts
type PdfUploadStatus =
    | 'idle'
    | 'validating'
    | 'compressing'
    | 'uploading'
    | 'success'
    | 'compression_failed'
    | 'upload_failed';
```

Dzięki temu UI może odpowiednio reagować na każdy etap.

---

# 15. Proponowane stany interfejsu

## `idle`

Użytkownik nie rozpoczął wysyłania.

```text
Kliknij, aby wybrać plik PDF
```

---

## `validating`

Frontend sprawdza:

- typ pliku,
- rozmiar,
- podstawową poprawność danych wejściowych.

UI:

```text
Sprawdzanie pliku...
```

---

## `compressing`

PDF jest aktualnie kompresowany.

UI może pokazywać:

```text
Plik jest za duży.
Trwa automatyczna kompresja...
```

Można również pokazywać:

```text
Kompresowanie — próba 1 z 3
```

Należy jednak pamiętać, że jest to propozycja UX — dokument źródłowy wymaga samej automatycznej kompresji, ale nie definiuje konkretnego tekstu statusu.

---

## `uploading`

Plik spełnia wymagania i jest przesyłany na serwer.

```text
Przesyłanie pliku...
```

---

## `success`

Plik został poprawnie zapisany.

UI powinien wrócić do standardowego stanu po przesłaniu pracy.

---

## `compression_failed`

Nie udało się uzyskać pliku mniejszego niż 3 MB po trzech próbach.

Komunikat:

```text
Twój plik jest za duży - system próbował go
skompresować, lecz jest niemożliwe
```

---

## `upload_failed`

Frontend przygotował plik, ale wysłanie go na serwer nie powiodło się.

Należy rozróżnić:

```text
kompresja się nie udała
```

od:

```text
kompresja się udała, ale upload się nie udał
```

Są to dwa różne problemy.

---

# 16. Obsługa błędów hostingu

Dokument określa dodatkowy scenariusz, w którym problem może wynikać z ograniczeń hostingu.

W takim przypadku użytkownik powinien otrzymać informację o możliwości ręcznego skompresowania pliku za pomocą:

**iLovePDF — Compress PDF**

Adres wskazany w dokumentacji:

https://www.ilovepdf.com/compress_pdf

Źródło wskazuje, że po skorzystaniu z zewnętrznego narzędzia użytkownik może ponownie przesłać mniejszy plik. fileciteturn0file0L13-L19

### Proponowany komunikat

```text
Nie udało się przesłać pliku PDF.

Jeżeli problem nadal występuje, spróbuj skompresować plik
na stronie iLovePDF, a następnie prześlij go ponownie.
```

Link powinien prowadzić do:

```text
https://www.ilovepdf.com/compress_pdf
```

---

# 17. Walidacja pliku

Przed rozpoczęciem kompresji należy zweryfikować, czy użytkownik rzeczywiście wybrał PDF.

Minimalna walidacja:

```text
Czy istnieje plik?
Czy rozszerzenie wskazuje na PDF?
Czy MIME type wskazuje na PDF?
```

Przykład:

```ts
if (!file) {
    throw new Error('FILE_REQUIRED');
}

if (file.type !== 'application/pdf') {
    throw new Error('INVALID_FILE_TYPE');
}
```

Nie należy jednak polegać wyłącznie na `file.type`, ponieważ dane przekazane przez przeglądarkę nie powinny być traktowane jako pełna walidacja bezpieczeństwa.

Backend powinien nadal wykonywać własną walidację pliku.

---

# 18. Frontend a backend

## Frontend odpowiada za

- wybór pliku,
- walidację wejścia,
- sprawdzenie rozmiaru,
- kompresję,
- maksymalnie trzy iteracje,
- przygotowanie finalnego `File`/`Blob`,
- wyświetlanie statusów,
- obsługę błędów UX,
- rozpoczęcie uploadu.

## Backend odpowiada za

- przyjęcie pliku,
- ponowną walidację,
- sprawdzenie limitów,
- autoryzację użytkownika,
- powiązanie pliku z odpowiednią pracą domową,
- zapis pliku,
- zwrócenie wyniku operacji.

Kompresja nie powinna być traktowana jako zamiennik walidacji backendowej.

---

# 19. Przykładowy moduł frontendowy

Proponowana struktura:

```text
src/
├── features/
│   └── homework-upload/
│       ├── components/
│       │   ├── HomeworkUpload.tsx
│       │   ├── PdfUploadField.tsx
│       │   └── UploadStatus.tsx
│       │
│       ├── services/
│       │   ├── pdfCompressor.ts
│       │   └── homeworkUpload.ts
│       │
│       ├── utils/
│       │   ├── fileValidation.ts
│       │   └── fileSize.ts
│       │
│       ├── types/
│       │   └── upload.ts
│       │
│       └── constants/
│           └── upload.ts
```

Nazwy należy dopasować do istniejącej architektury projektu.

---

# 20. Stałe

Wszystkie parametry biznesowe powinny być trzymane w jednym miejscu.

Przykład:

```ts
export const MAX_PDF_SIZE_BYTES = 3 * 1024 * 1024;

export const MAX_COMPRESSION_ATTEMPTS = 3;
```

Dzięki temu nie należy później szukać wartości `3 MB` i `3` w wielu plikach.

---

# 21. Funkcja sprawdzająca rozmiar

Przykład:

```ts
export function isPdfWithinLimit(file: File): boolean {
    return file.size <= MAX_PDF_SIZE_BYTES;
}
```

Można również wydzielić funkcję:

```ts
export function getFileSizeInMb(file: File): number {
    return file.size / (1024 * 1024);
}
```

---

# 22. Funkcja kompresująca

Warstwa kompresji powinna być oddzielona od komponentu UI.

Przykład interfejsu:

```ts
export async function compressPdf(file: File): Promise<File> {
    // implementation depends on selected PDF library
}
```

Komponent nie powinien zawierać bezpośrednio całej logiki biblioteki PDF.

Zamiast:

```tsx
// ogromna logika kompresji w komponencie
```

lepiej:

```tsx
const compressedFile = await compressPdf(file);
```

Dzięki temu biblioteka może zostać później wymieniona bez przebudowy całego widoku.

---

# 23. Główna funkcja przetwarzająca PDF

Przykładowa implementacja:

```ts
export async function preparePdfForUpload(file: File): Promise<File> {
    if (file.size <= MAX_PDF_SIZE_BYTES) {
        return file;
    }

    let currentFile = file;

    for (let attempt = 1; attempt <= MAX_COMPRESSION_ATTEMPTS; attempt++) {
        currentFile = await compressPdf(currentFile);

        if (currentFile.size <= MAX_PDF_SIZE_BYTES) {
            return currentFile;
        }
    }

    throw new CompressionLimitError();
}
```

Kluczowe zasady:

- plik poniżej limitu nie jest kompresowany,
- kompresja odbywa się maksymalnie trzy razy,
- każda kolejna próba działa na poprzednim wyniku,
- funkcja zwraca plik gotowy do uploadu,
- po trzech nieudanych próbach zgłaszany jest błąd.

---

# 24. Upload

Przykładowy przepływ:

```ts
async function handleUpload(file: File) {
    try {
        setStatus('validating');

        validatePdf(file);

        setStatus('compressing');

        const preparedFile = await preparePdfForUpload(file);

        setStatus('uploading');

        await uploadHomework(preparedFile);

        setStatus('success');
    } catch (error) {
        handleUploadError(error);
    }
}
```

W praktyce warto rozdzielić etap „sprawdź, czy trzeba kompresować” od samej kompresji, aby status UI nie sugerował kompresowania pliku, który od początku mieścił się w limicie.

---

# 25. Proponowany dokładniejszy przepływ

```ts
async function handlePdfUpload(file: File) {
    try {
        setStatus('validating');

        validatePdf(file);

        let finalFile = file;

        if (file.size > MAX_PDF_SIZE_BYTES) {
            for (let attempt = 1; attempt <= 3; attempt++) {
                setStatus({
                    type: 'compressing',
                    attempt
                });

                finalFile = await compressPdf(finalFile);

                if (finalFile.size <= MAX_PDF_SIZE_BYTES) {
                    break;
                }

                if (attempt === 3) {
                    throw new CompressionLimitError();
                }
            }
        }

        setStatus('uploading');

        await uploadHomework(finalFile);

        setStatus('success');
    } catch (error) {
        setStatus(mapErrorToStatus(error));
    }
}
```

---

# 26. Obsługa przycisku „Prześlij pracę”

Przycisk powinien być zablokowany w czasie wykonywania operacji.

Przykład:

```text
idle
   |
   v
Prześlij pracę
   |
   v
loading = true
```

Podczas:

```text
kompresji
```

oraz:

```text
uploadu
```

użytkownik nie powinien móc uruchomić drugiego równoległego uploadu tego samego formularza.

Po zakończeniu:

```text
loading = false
```

---

# 27. Anulowanie

Na makiecie znajduje się przycisk **„Anuluj”**.

Minimalne wymaganie:

- anulowanie powinno opuścić formularz/wycofać bieżącą akcję zgodnie z istniejącym mechanizmem aplikacji.

Jeżeli biblioteka kompresująca i upload API obsługują `AbortController`, można dodatkowo umożliwić przerwanie długiej operacji.

Nie jest to jednak wymaganie explicite opisane w źródłowym dokumencie.

---

# 28. Zarządzanie pamięcią

Kompresja PDF w przeglądarce może wymagać dużej ilości pamięci.

Przy każdym etapie mogą istnieć:

```text
oryginalny File
wynik kompresji #1
wynik kompresji #2
wynik kompresji #3
```

Dlatego należy unikać niepotrzebnego przechowywania wszystkich wyników.

Preferowany model:

```text
currentFile
    |
    v
newFile
    |
    v
currentFile = newFile
```

Jeżeli biblioteka używa `ArrayBuffer`, `Uint8Array` lub `Blob`, należy zwrócić uwagę na zwalnianie niepotrzebnych referencji.

---

# 29. Nazwa pliku

Jeżeli plik zostanie skompresowany, należy zdecydować, jaką nazwę otrzyma wynik.

Przykładowo:

```text
praca.pdf
```

może pozostać:

```text
praca.pdf
```

albo:

```text
praca_compressed.pdf
```

### Rekomendacja

Jeżeli użytkownik nie musi widzieć technicznej informacji o kompresji, lepiej zachować oryginalną nazwę:

```text
praca.pdf
```

a kompresję traktować jako wewnętrzny etap przygotowania pliku.

---

# 30. Jakość dokumentu

Kompresja może powodować pogorszenie jakości obrazu.

Jest to szczególnie istotne w przypadku prac matematycznych będących skanami lub zdjęciami.

Dlatego należy zweryfikować:

- czy tekst nadal jest czytelny,
- czy symbole matematyczne nie tracą jakości,
- czy zdjęcia/wykresy są nadal czytelne,
- czy wszystkie strony pozostają w dokumencie,
- czy PDF nadal otwiera się poprawnie.

Nie należy uznawać kompresji za udaną wyłącznie na podstawie rozmiaru.

Minimalny warunek techniczny:

```text
plik <= 3 MB
+
PDF można poprawnie otworzyć
```

---

# 31. Bezpieczeństwo

Ponieważ pliki są przesyłane przez użytkowników, backend powinien traktować je jako niezaufane dane wejściowe.

Należy zweryfikować:

- rozszerzenie,
- MIME type,
- rzeczywisty format pliku,
- rozmiar,
- autoryzację użytkownika,
- uprawnienia do konkretnego kursu/pracy domowej.

Frontendowa kompresja nie zastępuje zabezpieczeń backendowych.

---

# 32. API

Dokument źródłowy nie definiuje konkretnego endpointu API.

Dlatego przed implementacją należy znaleźć istniejący endpoint odpowiedzialny za przesyłanie pracy domowej i wykorzystać go bez tworzenia niepotrzebnego nowego endpointu.

Przykładowy model:

```http
POST /api/homework/{homeworkId}/submission
Content-Type: multipart/form-data
```

**Uwaga:** jest to przykład architektoniczny, a nie endpoint wynikający z dostarczonego dokumentu. Należy użyć rzeczywistego API projektu.

---

# 33. Przykładowy request

```text
POST /existing-upload-endpoint

multipart/form-data

file = prepared-homework.pdf
```

Frontend powinien przesłać:

```text
oryginalny PDF
```

jeżeli mieści się w limicie albo:

```text
skompresowany PDF
```

jeżeli kompresja była konieczna.

---

# 34. Walidacja backendowa

Backend powinien ponownie sprawdzić:

```text
Czy plik jest PDF?
Czy plik ma dozwolony rozmiar?
Czy użytkownik ma prawo przesłać pracę?
Czy dana praca domowa istnieje?
Czy format danych jest prawidłowy?
```

Przykładowo:

```text
HTTP 200/201
    -> sukces

HTTP 400
    -> nieprawidłowe dane

HTTP 401
    -> brak autoryzacji

HTTP 403
    -> brak uprawnień

HTTP 413
    -> payload/file za duży

HTTP 5xx
    -> problem serwera/infrastruktury
```

Dokładne kody należy dopasować do istniejącego API.

---

# 35. Rozróżnienie błędów

Frontend powinien rozróżniać co najmniej:

```text
INVALID_FILE
COMPRESSION_FAILED
COMPRESSION_LIMIT_REACHED
UPLOAD_FAILED
FILE_TOO_LARGE
NETWORK_ERROR
SERVER_ERROR
```

Nie każdy błąd powinien wyświetlać ten sam komunikat.

---

# 36. Obsługa błędu po kompresji

Jeżeli kompresja rzuci wyjątek:

```ts
try {
    const compressed = await compressPdf(file);
} catch {
    // compression failed
}
```

należy poinformować użytkownika, że automatyczne przygotowanie pliku się nie powiodło.

Nie należy udawać, że problem wynika z rozmiaru, jeżeli biblioteka faktycznie nie była w stanie przetworzyć PDF.

---

# 37. Obsługa błędu uploadu

Jeżeli:

```text
PDF = 2.5 MB
```

ale:

```text
POST -> HTTP 500
```

to nie oznacza, że trzeba ponownie kompresować PDF.

Plik już spełnia wymaganie rozmiarowe.

Należy zgłosić problem z przesłaniem.

---

# 38. Przypadek HTTP 413

Jeżeli backend zwróci:

```text
413 Payload Too Large
```

oznacza to, że serwer/infrastruktura odrzuciła żądanie ze względu na rozmiar.

W takim przypadku należy sprawdzić konfigurację:

- reverse proxy,
- web server,
- API,
- hosting,
- storage,
- limity frameworka.

Przykładowe miejsca konfiguracji:

```text
Nginx
Apache
Cloudflare
backend framework
platforma hostingowa
storage
```

---

# 39. Ważna różnica: limit aplikacji vs limit hostingu

Projekt definiuje:

```text
3 MB
```

jako limit, do którego należy przygotować plik.

Nie oznacza to automatycznie, że każdy element infrastruktury również ma limit dokładnie 3 MB.

Przykład:

```text
Frontend: 3 MB
Backend: 5 MB
Reverse proxy: 2 MB
```

Wtedy nawet poprawny plik:

```text
2.8 MB
```

może zostać odrzucony przez reverse proxy.

Dlatego przed wdrożeniem należy sprawdzić cały łańcuch:

```text
Browser
   ↓
CDN / Proxy
   ↓
Web server
   ↓
Backend
   ↓
Storage
```

---

# 40. UX — informowanie użytkownika

Użytkownik nie powinien widzieć jedynie:

```text
Loading...
```

przez długi czas.

Lepszy komunikat:

```text
Plik jest większy niż 3 MB.
Trwa automatyczna kompresja...
```

Podczas kolejnych prób:

```text
Kompresowanie pliku — próba 2 z 3
```

Po sukcesie:

```text
Plik został przygotowany.
Trwa przesyłanie...
```

Po porażce:

```text
Twój plik jest za duży - system próbował go
skompresować, lecz jest niemożliwe.
```

---

# 41. UX — blokowanie wielokrotnego wysyłania

W czasie kompresji i uploadu:

```text
Prześlij pracę -> disabled
```

Powód:

```text
użytkownik kliknie 5 razy
        |
        v
5 niezależnych operacji kompresji/uploadu
```

Może to powodować:

- wielokrotne przesłanie pracy,
- przeciążenie przeglądarki,
- problemy z backendem.

---

# 42. Testy jednostkowe

Należy przetestować logikę niezależnie od biblioteki PDF.

## Test 1 — plik mniejszy niż limit

```text
Input: 2 MB
Expected:
- brak kompresji
- 1 upload
```

---

## Test 2 — plik dokładnie na limicie

```text
Input: 3 MB
Expected:
- brak kompresji
- upload
```

Należy jednoznacznie ustalić, że warunek:

```ts
file.size <= MAX_PDF_SIZE_BYTES
```

oznacza akceptację pliku dokładnie równego limitowi.

---

## Test 3 — plik większy niż limit

```text
Input: 5 MB
Expected:
- kompresja
```

---

## Test 4 — sukces po pierwszej próbie

```text
5 MB
 ↓
2.8 MB
```

Expected:

```text
compress x1
upload x1
```

---

## Test 5 — sukces po drugiej próbie

```text
7 MB
 ↓
4.5 MB
 ↓
2.9 MB
```

Expected:

```text
compress x2
upload x1
```

---

## Test 6 — sukces po trzeciej próbie

```text
10 MB
 ↓
7 MB
 ↓
5 MB
 ↓
2.9 MB
```

Expected:

```text
compress x3
upload x1
```

---

## Test 7 — brak możliwości kompresji

```text
10 MB
 ↓
8 MB
 ↓
7 MB
 ↓
6 MB
```

Expected:

```text
compress x3
upload x0
error = COMPRESSION_LIMIT_REACHED
```

---

## Test 8 — kompresor rzuca wyjątek

Expected:

```text
compress
   |
   X
error
```

Nie powinno dojść do uploadu.

---

## Test 9 — upload kończy się błędem

```text
compressedFile.size <= 3 MB
```

ale:

```text
upload -> error
```

Expected:

```text
upload error
```

bez dodatkowej kompresji.

---

# 43. Testy integracyjne

Należy sprawdzić rzeczywisty przepływ:

```text
wybór kursu
   ↓
Prześlij pracę domową
   ↓
Plik PDF
   ↓
wybór pliku
   ↓
Prześlij pracę
   ↓
kompresja
   ↓
upload
```

### Scenariusz A

PDF 2 MB.

Oczekiwane:

```text
upload bez kompresji
```

### Scenariusz B

PDF 5 MB, kompresja daje 2.8 MB.

Oczekiwane:

```text
1 kompresja
1 upload
```

### Scenariusz C

PDF > 3 MB, trzy kompresje nie dają wyniku < 3 MB.

Oczekiwane:

```text
3 kompresje
0 uploadów
komunikat o zbyt dużym pliku
```

---

# 44. Testy E2E

Test E2E powinien odwzorowywać zachowanie pokazane w dokumentacji.

Przykładowy scenariusz:

```text
Given użytkownik znajduje się w kursie

When wybiera „Prześlij pracę domową”

And wybiera „Plik PDF”

And wybiera plik większy niż 3 MB

And klika „Prześlij pracę”

Then system rozpoczyna kompresję

And sprawdza wynik

And jeżeli plik spełnia limit, wysyła go

And użytkownik widzi potwierdzenie przesłania
```

Drugi scenariusz:

```text
Given PDF nie może zostać zmniejszony poniżej 3 MB

When system wykona 3 próby

Then upload nie zostaje wykonany

And użytkownik otrzymuje komunikat o zbyt dużym pliku
```

---

# 45. Testowanie różnych PDF-ów

Szczególnie ważne jest przygotowanie fixture'ów:

```text
fixtures/
├── small.pdf
├── exactly-3mb.pdf
├── large-text.pdf
├── large-scanned.pdf
├── already-compressed.pdf
└── impossible-to-compress.pdf
```

Dokładne pliki testowe należy przygotować przed implementacją testów E2E.

---

# 46. Kryteria akceptacji

## AC-01 — plik <= 3 MB

**Given:** użytkownik wybrał PDF nie większy niż 3 MB.

**When:** klika „Prześlij pracę”.

**Then:** PDF jest wysyłany bez automatycznej kompresji.

---

## AC-02 — automatyczna kompresja

**Given:** użytkownik wybrał PDF większy niż 3 MB.

**When:** klika „Prześlij pracę”.

**Then:** frontend rozpoczyna kompresję PDF.

---

## AC-03 — sukces kompresji

**Given:** PDF jest większy niż 3 MB.

**When:** po kompresji otrzymany plik ma mniej niż 3 MB.

**Then:** plik jest wysyłany na serwer.

---

## AC-04 — maksymalnie trzy próby

**Given:** PDF pozostaje większy niż 3 MB.

**When:** system wykonuje kolejne próby.

**Then:** liczba prób nie przekracza 3.

---

## AC-05 — brak możliwości kompresji

**Given:** po trzeciej próbie PDF nadal jest większy niż 3 MB.

**Then:** plik nie zostaje wysłany.

**And:** użytkownik otrzymuje komunikat:

```text
Twój plik jest za duży - system próbował go
skompresować, lecz jest niemożliwe
```

---

## AC-06 — błąd hostingu

**Given:** plik jest przygotowany, ale infrastruktura nie pozwala go przesłać.

**Then:** użytkownik otrzymuje informację o możliwości ręcznej kompresji PDF.

---

# 47. Definition of Done

Funkcjonalność można uznać za zakończoną, gdy:

- [ ] PDF można wybrać z formularza pracy domowej.
- [ ] Frontend rozpoznaje PDF.
- [ ] Frontend sprawdza rozmiar.
- [ ] Pliki <= 3 MB nie są kompresowane.
- [ ] Pliki > 3 MB są kompresowane po stronie frontendu.
- [ ] Wynik kompresji jest ponownie sprawdzany.
- [ ] Maksymalnie wykonywane są 3 próby.
- [ ] Kolejna próba wykorzystuje wynik poprzedniej.
- [ ] Plik <= 3 MB zostaje przesłany.
- [ ] Plik, którego nie udało się zmniejszyć, nie jest wysyłany.
- [ ] Wyświetlany jest wymagany komunikat błędu.
- [ ] Obsługiwany jest błąd uploadu.
- [ ] Obsługiwany jest przypadek ograniczenia hostingu.
- [ ] Istnieją testy jednostkowe.
- [ ] Istnieją testy integracyjne.
- [ ] Istnieje co najmniej jeden test E2E.
- [ ] Funkcja działa na typowych PDF-ach.
- [ ] Nie występują niekontrolowane wielokrotne uploady.
- [ ] Nie występuje nieskończona pętla kompresji.
- [ ] Backend nadal wykonuje własną walidację.

---

# 48. Proponowany podział zadań implementacyjnych

## Zadanie 1 — analiza istniejącego uploadu

Sprawdzić:

- obecny komponent uploadu,
- obecny endpoint,
- model danych pracy domowej,
- obecne limity plików,
- obsługę błędów,
- sposób zapisywania pliku.

---

## Zadanie 2 — stałe i walidacja

Dodać:

```ts
MAX_PDF_SIZE_BYTES
MAX_COMPRESSION_ATTEMPTS
```

oraz funkcje:

```ts
validatePdf()
isPdfWithinLimit()
```

---

## Zadanie 3 — wybór biblioteki

Wykonać PoC kompresji.

Sprawdzić:

```text
input size
output size
compression time
quality
memory usage
browser compatibility
```

---

## Zadanie 4 — moduł kompresji

Utworzyć:

```text
pdfCompressor.ts
```

z API:

```ts
compressPdf(file): Promise<File>
```

---

## Zadanie 5 — algorytm trzech iteracji

Zaimplementować:

```text
if <= 3 MB
    upload

else
    compression 1
    check

    compression 2
    check

    compression 3
    check

    if still > 3 MB
        error
```

---

## Zadanie 6 — integracja z uploadem

Podłączyć przygotowany plik do istniejącego mechanizmu wysyłania pracy.

---

## Zadanie 7 — UI

Dodać stany:

```text
validating
compressing
uploading
success
error
```

---

## Zadanie 8 — obsługa błędów

Rozróżnić:

```text
invalid PDF
compression error
file too large
upload error
server error
network error
```

---

## Zadanie 9 — testy

Dodać testy:

```text
unit
integration
E2E
```

---

## Zadanie 10 — test manualny

Przetestować funkcję na realnym przepływie:

```text
kurs
→ Prześlij pracę domową
→ Plik PDF
→ wybór pliku
→ Prześlij pracę
```

---

# 49. Przypadki brzegowe

## Plik ma dokładnie 3 MB

Powinien zostać zaakceptowany, jeżeli limit jest zdefiniowany jako:

```text
<= 3 MB
```

---

## Plik ma 3.01 MB

Powinien rozpocząć kompresję.

---

## Plik ma 0 bajtów

Powinien zostać odrzucony jako nieprawidłowy/uszkodzony.

---

## Plik ma rozszerzenie `.pdf`, ale nie jest PDF-em

Powinien zostać odrzucony.

---

## PDF jest już bardzo mocno skompresowany

System może nie uzyskać znaczącej redukcji rozmiaru.

Po trzech próbach należy zakończyć proces.

---

## Kompresja zwiększa rozmiar

Jeżeli:

```text
5 MB -> 5.2 MB
```

to wynik nie spełnia warunku.

Można wykonać kolejną iterację zgodnie z limitem trzech prób, ale należy sprawdzić zachowanie wybranej biblioteki.

---

## Kompresja zwraca uszkodzony PDF

Nie należy wysyłać go bez sprawdzenia.

Należy przetestować możliwość poprawnego odczytu wyniku przez bibliotekę lub przynajmniej poprawność wygenerowanego PDF.

---

# 50. Wydajność

Kompresja wykonywana w przeglądarce może blokować główny wątek.

Jeżeli wybrana biblioteka wykonuje ciężkie operacje synchronicznie, należy rozważyć:

```text
Web Worker
```

Schemat:

```text
UI Thread
   |
   | start compression
   v
Web Worker
   |
   | compress
   v
compressed PDF
   |
   v
UI Thread
```

Dzięki temu interfejs nie powinien się zawieszać podczas przetwarzania dużego dokumentu.

Jest to rekomendacja techniczna, a nie wymaganie wynikające bezpośrednio z dokumentu.

---

# 51. Monitoring

Warto rejestrować informacje techniczne:

```text
original file size
number of compression attempts
final file size
compression duration
upload duration
upload result
```

Nie należy jednak logować zawartości PDF ani wrażliwych danych znajdujących się w pracy ucznia.

---

# 52. Metryki

Przydatne metryki:

```text
compression_success_rate
average_compression_attempts
average_compression_duration
compression_failure_rate
upload_failure_rate
```

Pozwoli to odpowiedzieć na pytania:

- jak często jedna kompresja wystarcza,
- jak często potrzebne są trzy próby,
- jak często PDF-ów nie da się zmniejszyć,
- czy kompresja nie trwa zbyt długo.

---

# 53. Potencjalne problemy techniczne

### Problem 1 — biblioteka nie działa w przeglądarce

Rozwiązanie:

- zmienić bibliotekę,
- użyć WebAssembly,
- użyć Web Workera,
- zweryfikować wymagania środowiska.

---

### Problem 2 — kompresja jest zbyt wolna

Możliwe działania:

- Web Worker,
- ograniczenie jakości obrazów,
- optymalizacja parametrów biblioteki,
- zmiana biblioteki.

---

### Problem 3 — wynik nadal jest > 3 MB

Rozwiązanie:

- maksymalnie trzy próby,
- po trzeciej próbie komunikat błędu.

---

### Problem 4 — hosting odrzuca poprawny plik

Należy sprawdzić:

```text
proxy limit
server limit
API limit
storage limit
```

---

### Problem 5 — użytkownik opuszcza stronę podczas kompresji

Operacja może zostać przerwana.

Nie należy zakładać, że upload zakończy się po opuszczeniu strony.

---

# 54. Przykładowy diagram sekwencji

```text
User              Frontend              PDF Compressor       Backend
 |                   |                       |                  |
 |-- choose PDF ---->|                       |                  |
 |                   |                       |                  |
 |                   |-- check size -------->|                  |
 |                   |                       |                  |
 |                   |<-- size > 3 MB ------|                  |
 |                   |                       |                  |
 |                   |-- compress ---------->|                  |
 |                   |<-- compressed PDF ----|                  |
 |                   |                       |                  |
 |                   |-- check size -------->|                  |
 |                   |                       |                  |
 |                   |-- upload -------------------------------->|
 |                   |                       |                  |
 |                   |<---------------------------------- result-|
 |<-- success -------|                       |                  |
```

W przypadku nieudanego kompresowania:

```text
User
 |
 v
Frontend
 |
 +--> compress #1 --> > 3 MB
 |
 +--> compress #2 --> > 3 MB
 |
 +--> compress #3 --> > 3 MB
 |
 v
Error message
```

---

# 55. Przykładowy diagram stanów

```text
                 +-------+
                 | IDLE  |
                 +---+---+
                     |
                     v
              +--------------+
              | VALIDATING   |
              +------+-------+
                     |
             +-------+-------+
             |               |
          <= 3 MB          > 3 MB
             |               |
             |               v
             |        +-------------+
             |        | COMPRESSING |
             |        +------+------+
             |               |
             |       +-------+-------+
             |       |               |
             |    <= 3 MB          > 3 MB
             |       |               |
             |       |         attempts < 3
             |       |               |
             |       |               +----> COMPRESSING
             |       |
             +-------+
                     |
                     v
                +---------+
                | UPLOAD  |
                +----+----+
                     |
               +-----+-----+
               |           |
             success      error
               |           |
               v           v
            SUCCESS    UPLOAD_ERROR

Po 3 nieudanych kompresjach:
                     |
                     v
             COMPRESSION_ERROR
```

---

# 56. Checklist przed Pull Requestem

### Kod

- [ ] Kompresja znajduje się po stronie frontendu.
- [ ] Limit 3 MB jest zdefiniowany jako stała.
- [ ] Maksymalna liczba prób wynosi 3.
- [ ] Brak nieskończonych pętli.
- [ ] Wynik poprzedniej kompresji jest wejściem kolejnej.
- [ ] Upload odbywa się dopiero po spełnieniu limitu.
- [ ] Błędy są obsługiwane.
- [ ] Kod kompresji jest oddzielony od UI.

### UI

- [ ] Użytkownik wie, że trwa kompresja.
- [ ] Przycisk uploadu jest zablokowany podczas operacji.
- [ ] Błąd kompresji ma właściwy komunikat.
- [ ] Błąd uploadu ma osobny komunikat.
- [ ] Istnieje możliwość anulowania zgodnie z istniejącym UX.

### Testy

- [ ] < 3 MB.
- [ ] = 3 MB.
- [ ] > 3 MB.
- [ ] Sukces po 1 próbie.
- [ ] Sukces po 2 próbach.
- [ ] Sukces po 3 próbach.
- [ ] Brak sukcesu po 3 próbach.
- [ ] Błąd biblioteki.
- [ ] Błąd uploadu.
- [ ] Błąd hostingu.
- [ ] Nieprawidłowy PDF.

---

# 57. Checklist wdrożeniowy

Przed wdrożeniem należy sprawdzić:

```text
[ ] frontend build
[ ] kompatybilność przeglądarek
[ ] rozmiar bundle
[ ] działanie biblioteki PDF
[ ] limity backendu
[ ] limity reverse proxy
[ ] limity storage
[ ] upload dużego PDF
[ ] upload małego PDF
[ ] kompresja skanu
[ ] kompresja PDF tekstowego
[ ] komunikaty błędów
[ ] test E2E
```

---

# 58. Kolejność implementacji

Rekomendowana kolejność prac:

```text
1. Analiza obecnego uploadu
        ↓
2. Analiza limitów backendu/hostingu
        ↓
3. PoC biblioteki PDF
        ↓
4. Implementacja validatePdf()
        ↓
5. Implementacja compressPdf()
        ↓
6. Implementacja algorytmu 3 iteracji
        ↓
7. Integracja z istniejącym uploadem
        ↓
8. Obsługa stanów UI
        ↓
9. Obsługa błędów
        ↓
10. Testy jednostkowe
        ↓
11. Testy integracyjne
        ↓
12. Test E2E
        ↓
13. Test manualny
        ↓
14. Pull Request
```

---

# 59. Najważniejsze decyzje projektowe

| Decyzja | Wartość |
|---|---|
| Format | PDF |
| Miejsce kompresji | Frontend |
| Limit docelowy | 3 MB |
| Maksymalna liczba iteracji | 3 |
| Upload przed spełnieniem limitu | Nie |
| Upload po sukcesie kompresji | Tak |
| Upload po 3 nieudanych próbach | Nie |
| Zewnętrzne narzędzie awaryjne | iLovePDF |
| Kompresja backendowa | Nie w ramach obecnego założenia |

Limit, miejsce kompresji, liczba iteracji oraz zachowanie po nieudanej kompresji wynikają z dostarczonego opisu funkcjonalności. fileciteturn0file0L5-L19

---

# 60. Minimalna wersja MVP

Jeżeli projekt ma zostać wykonany możliwie szybko, MVP powinno zawierać:

```text
1. wybór PDF
2. sprawdzenie rozmiaru
3. limit 3 MB
4. kompresję frontendową
5. maksymalnie 3 próby
6. ponowne sprawdzanie rozmiaru
7. upload po sukcesie
8. komunikat po 3 nieudanych próbach
9. obsługę błędu uploadu
10. testy podstawowych scenariuszy
```

Dopiero później można dodać:

```text
- Web Worker
- zaawansowane statusy
- metryki
- monitoring
- dodatkowe testy wydajnościowe
- bardziej rozbudowane UX
```

---

# 61. Finalny przepływ użytkownika

Pełny docelowy proces:

```text
┌───────────────────────┐
│ Uczeń wybiera kurs    │
└───────────┬───────────┘
            │
            v
┌─────────────────────────────┐
│ „Prześlij pracę domową”    │
└───────────┬─────────────────┘
            │
            v
┌─────────────────────────────┐
│ Wybór „Plik PDF”            │
└───────────┬─────────────────┘
            │
            v
┌─────────────────────────────┐
│ Uczeń wybiera PDF            │
└───────────┬─────────────────┘
            │
            v
┌─────────────────────────────┐
│ Sprawdzenie rozmiaru         │
└───────────┬─────────────────┘
            │
       ┌────┴─────┐
       │          │
     <=3 MB      >3 MB
       │          │
       │          v
       │    ┌───────────────┐
       │    │ Kompresja #1  │
       │    └───────┬───────┘
       │            │
       │        sprawdzenie
       │            │
       │       ┌────┴────┐
       │       │         │
       │     <=3 MB     >3 MB
       │       │         │
       │       │         v
       │       │   ┌───────────────┐
       │       │   │ Kompresja #2  │
       │       │   └───────┬───────┘
       │       │           │
       │       │       sprawdzenie
       │       │           │
       │       │      ┌────┴────┐
       │       │      │         │
       │       │    <=3 MB     >3 MB
       │       │      │         │
       │       │      │         v
       │       │      │   ┌───────────────┐
       │       │      │   │ Kompresja #3  │
       │       │      │   └───────┬───────┘
       │       │      │           │
       │       │      │       sprawdzenie
       │       │      │           │
       │       │      │      ┌────┴────┐
       │       │      │      │         │
       │       │      │    <=3 MB     >3 MB
       │       │      │      │         │
       └───────┴──────┴──────┘         │
                    │                  │
                    v                  v
             ┌─────────────┐   ┌─────────────────┐
             │ Upload PDF   │   │ Błąd kompresji  │
             └──────┬──────┘   └─────────────────┘
                    │
              ┌─────┴─────┐
              │           │
            sukces       błąd
              │           │
              v           v
          ┌───────┐   ┌─────────────┐
          │  OK   │   │ Upload error│
          └───────┘   └─────────────┘
```

---

# 62. Podsumowanie

Funkcja **Kompresor PDF** powinna być zaimplementowana jako warstwa przygotowania pliku działająca przed istniejącym mechanizmem uploadu.

Najważniejsza reguła brzmi:

```text
PDF <= 3 MB
    -> upload

PDF > 3 MB
    -> compress
    -> check
    -> compress
    -> check
    -> compress
    -> check
    -> jeśli nadal > 3 MB: błąd
```

Kompresja odbywa się po stronie frontendu, a liczba prób jest ograniczona do trzech. Jeżeli plik nie może zostać zmniejszony do wymaganego rozmiaru, nie powinien być wysyłany na serwer. Użytkownik powinien otrzymać wskazany komunikat o niemożności dalszego zmniejszenia pliku. W przypadku problemów wynikających z infrastruktury należy dodatkowo poinformować użytkownika o możliwości ręcznej kompresji PDF przy użyciu iLovePDF. fileciteturn0file0L5-L19

## Źródło wymagań

Dokument źródłowy: **„Opis projektu (3)(1).pdf”**, zawierający opis funkcjonalności „Kompresor PDF” oraz makiety procesu przesyłania pracy domowej. Szczególnie istotne są strony 1–2: opis limitu 3 MB, kompresji frontendowej, trzech iteracji, komunikatu błędu oraz przebiegu wyboru i przesyłania PDF. fileciteturn0file0L2-L29

> **Uwaga implementacyjna:** elementy takie jak struktura katalogów, nazwy funkcji TypeScript, przykładowe endpointy API, typy stanów, Web Worker, metryki i szczegółowe przypadki testowe są propozycjami technicznymi przygotowanymi na podstawie wymagań. Nie są one bezpośrednio zdefiniowane w dostarczonym opisie i należy je dopasować do istniejącej architektury projektu.
