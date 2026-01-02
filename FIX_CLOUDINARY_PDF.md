# 🔧 FIX: Cloudinary PDF 401 Unauthorized

## Problem

PDFy uploadowane do Cloudinary zwracają błąd **401 Unauthorized** i nie można ich pobrać.

## Przyczyna

Pliki były uploadowane z domyślnym `access_mode: "authenticated"` zamiast `"public"`.

## ✅ Rozwiązanie już zastosowane

### 1. Zaktualizowałem `src/lib/cloudinary.ts`

Dodałem `access_mode: "public"` do opcji uploadu:

```typescript
{
  folder,
  resource_type: "auto",
  allowed_formats: ["pdf", "jpg", "png", "jpeg", "mp4", "mov"],
  access_mode: "public", // ← NOWA LINIA - pliki będą publicznie dostępne
}
```

### 2. Co to zmienia?

- **Nowe** pliki będą automatycznie publiczne ✅
- **Stare** pliki są nadal prywatne ❌

## 🔄 Jak naprawić stare pliki?

### OPCJA 1: Ponownie uploaduj materiały (ZALECANE)

1. Uruchom serwer: `npm run dev`
2. Zaloguj się jako TEACHER
3. Przejdź do kursu → Rozdział → Podrozdział
4. Znajdź stary materiał PDF (ten co nie działa)
5. **Usuń** stary materiał (kliknij ikonę kosza)
6. **Dodaj nowy** materiał (kliknij "Dodaj Materiał")
7. Uploaduj ten sam PDF ponownie
8. Nowy plik będzie **publiczny** i zadziała ✅

### OPCJA 2: Cloudinary Dashboard (manualnie)

1. Przejdź do [Cloudinary Console](https://console.cloudinary.com/)
2. Zaloguj się (cloud_name: `dz8teilwo`)
3. Media Library → `mathify/materials`
4. Dla każdego pliku:
   - Kliknij plik
   - Settings → Access Control
   - Zmień z "Private" na "Public"
   - Save

### OPCJA 3: Użyj signed URLs (NIE ZALECANE - komplikuje kod)

Zamiast zmieniać access mode, generuj podpisane URLe dla każdego dostępu.
To wymaga zmiany w kodzie i jest wolniejsze.

---

## ✅ TEST nowego uploadu

1. Sprawdź że serwer działa: `npm run dev`
2. Zaloguj się jako nauczyciel
3. Dodaj nowy materiał PDF
4. Sprawdź czy student może go pobrać
5. Jeśli działa ✅ → Zrób to samo dla starych materiałów

---

## 📝 Dla nowych deploymentów

**NIE MUSISZ NIC ROBIĆ** - kod już jest poprawiony!
Wszystkie nowe pliki będą automatycznie publiczne.

---

**Status**: ✅ KOD NAPRAWIONY
**Action Required**: Ponownie uploaduj stare materiały PDF
