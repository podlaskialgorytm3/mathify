# Cloudinary Setup - Instrukcja

## ⚠️ ZNANY PROBLEM (2025-01-02)

**Problem**: Stare pliki uploadowane PRZED 2025-01-02 zwracają błąd 401 (Unauthorized)  
**Przyczyna**: Były uploadowane jako "authenticated" zamiast "public"  
**Rozwiązanie**: Zobacz [FIX_CLOUDINARY_PDF.md](FIX_CLOUDINARY_PDF.md)  
**Status**: ✅ Kod naprawiony - nowe pliki działają

---

## ✅ Co zostało zrobione:

### 1. Zależności

```bash
npm install cloudinary @radix-ui/react-progress
```

### 2. Struktura plików

- **`src/lib/cloudinary.ts`** - Konfiguracja Cloudinary (parsowanie CLOUDINARY_URL)
- **`src/app/api/upload/route.ts`** - API endpoint do uploadu plików
- **`src/components/FileUpload.tsx`** - Komponent UI z drag & drop
- **`src/components/ui/progress.tsx`** - Progress bar

### 3. Zmiany w kodzie

- **`src/app/dashboard/teacher/courses/[id]/page.tsx`** - Zintegrowano FileUpload z formularzem materiałów
- **`src/app/api/teacher/subchapters/[subchapterId]/materials/route.ts`** - Zmieniono z FormData na JSON (przyjmuje URL zamiast pliku)

## 🔧 Konfiguracja lokalna

### 1. ✅ CLOUDINARY_URL w `.env` jest już ustawiony

```env
CLOUDINARY_URL=cloudinary://962631472692194:LYXlRRUJtN9Q7XCltLDyTaBx6rA@dz8teilwo
```

⚠️ **WAŻNE**: NIE używaj nawiasów `<>` w API_KEY ani API_SECRET!

Format: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`

### 2. Uruchom serwer deweloperski

```bash
npm run dev
```

### 3. Testowanie uploadu

1. Zaloguj się jako TEACHER (http://localhost:3000/login)
2. Przejdź do kursu: **Dashboard → Kursy → [Wybierz kurs]**
3. Kliknij na rozdział, potem podrozdział
4. Kliknij **"Dodaj Materiał"**
5. Wybierz typ: **"Plik PDF"**
6. **Drag & drop** lub kliknij "Wybierz plik" i wybierz PDF
7. Poczekaj na upload (zobaczysz progress bar)
8. Po uploadsie pojawi się "✓ Plik został przesłany"
9. Kliknij **"Dodaj"**

### 4. Sprawdzenie wyniku

- Materiał powinien być widoczny w liście materiałów
- URL w bazie będzie wskazywał na Cloudinary (np. `https://res.cloudinary.com/dz8teilwo/...`)
- Student może pobrać plik klikając na materiał

## 📋 Limity Cloudinary Free Tier

- **Storage**: 10 GB
- **Bandwidth**: 25 GB/miesiąc
- **Max file size**: 100 MB
- **Transformacje**: 25,000/miesiąc

## 🚀 Deploy na Vercel

Po przetestowaniu lokalnie:

1. Przejdź do [Vercel Dashboard](https://vercel.com/dashboard)
2. Wybierz projekt **mathify-eductation**
3. Settings → Environment Variables
4. Dodaj nową zmienną:
   - **Key**: `CLOUDINARY_URL`
   - **Value**: `cloudinary://962631472692194:LYXlRRUJtN9Q7XCltLDyTaBx6rA@dz8teilwo`
   - **Environment**: Production (zaznacz wszystkie: Production, Preview, Development)
5. Kliknij **Save**
6. Przejdź do **Deployments**
7. Kliknij **Redeploy** na ostatnim deploymencie

## 🐛 Troubleshooting

### Błąd: "CLOUDINARY_URL nie jest ustawiony"

- Sprawdź czy `.env` zawiera `CLOUDINARY_URL` bez `<>`
- Restartuj serwer deweloperski (`Ctrl+C` → `npm run dev`)

### Błąd: "Failed to upload"

- Sprawdź czy API_KEY, API_SECRET i CLOUD_NAME są poprawne
- Sprawdź logi w terminalu (backend)
- Sprawdź DevTools → Console (frontend)

### Plik za duży

- Cloudinary Free: max 100 MB na plik
- Zmień limit w `FileUpload.tsx` jeśli potrzeba

### Błąd 401 Unauthorized

- API Key lub API Secret są nieprawidłowe
- Sprawdź czy CLOUDINARY_URL jest poprawny

## 📝 Notatki

- Pliki są uploadowane do folderu `mathify/materials` w Cloudinary
- Stare pliki w `/public/uploads/materials` **NIE** będą już używane (można je usunąć)
- Każdy upload jest **natychmiastowy** - NIE trzeba czekać na deploy
- Studenci mogą pobierać pliki bezpośrednio z Cloudinary (szybki CDN)

## 🔄 Rollback (gdyby coś poszło nie tak)

Jeśli chcesz wrócić do lokalnego storage:

1. Skopiuj starą wersję `materials/route.ts` z gita
2. Usuń import `FileUpload` z `courses/[id]/page.tsx`
3. Przywróć stary `MaterialModal` (z `<input type="file">`)

---

**Status**: ✅ **TESTED AND WORKING LOCALLY**
**Test Result**: Upload successful @ 2025-01-XX

- First upload failed with `<>` brackets in API_KEY
- After removing brackets: ✅ SUCCESS (200 OK)
- File uploaded to Cloudinary
- Material saved to database

**Next Step**: Deploy na Vercel (dodaj `CLOUDINARY_URL` w Environment Variables)
