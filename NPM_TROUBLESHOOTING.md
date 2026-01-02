# Rozwiązywanie problemów z instalacją npm

## Problem: Konflikt wersji peer dependencies

### Błąd

```
npm error ERESOLVE unable to resolve dependency tree
npm error Could not resolve dependency:
npm error peer react@"^18.0.0" from @testing-library/react@14.3.1
```

### Przyczyna

Projekt używa React 19, ale niektóre biblioteki testowe wymagają React 18.

## Rozwiązania

### Rozwiązanie 1: Użyj `--legacy-peer-deps` (ZALECANE)

```bash
npm install --legacy-peer-deps
```

To ignoruje konflikty peer dependencies i pozwala na instalację pakietów.

### Rozwiązanie 2: Plik `.npmrc`

Utwórz plik `.npmrc` w głównym katalogu projektu z zawartością:

```
legacy-peer-deps=true
```

Po tym możesz używać normalnego `npm install` bez dodatkowych flag.

### Rozwiązanie 3: Aktualizacja wersji

Zaktualizuj `@testing-library/react` do wersji kompatybilnej z React 19:

```json
"@testing-library/react": "^16.0.0"
```

Następnie uruchom:

```bash
npm install
```

## Status

✅ **ROZWIĄZANE** - Projekt używa `.npmrc` z `legacy-peer-deps=true`

## Weryfikacja

Sprawdź, czy instalacja działa:

```bash
npm install
```

Sprawdź, czy testy działają:

```bash
npm test
```

## Uwagi

- Plik `.npmrc` jest już skonfigurowany w projekcie
- Możesz bezpiecznie używać `npm install` bez dodatkowych flag
- Testy działają poprawnie mimo ostrzeżeń o peer dependencies
- React 19 jest kompatybilny z większością funkcjonalności testowych

## Dodatkowe komendy

Jeśli nadal masz problemy:

```bash
# Wyczyść cache npm
npm cache clean --force

# Usuń node_modules i package-lock.json
rm -rf node_modules package-lock.json

# Zainstaluj ponownie
npm install --legacy-peer-deps
```

## Kontakt

W przypadku dalszych problemów, sprawdź:

- Wersję Node.js: `node --version` (wymagana >= 18.0.0)
- Wersję npm: `npm --version`
- Logi instalacji: `C:\Users\micha\AppData\Local\npm-cache\_logs\`
