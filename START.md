# 🚀 Jak uruchomić Mathify

## Szybki start (Zalecane dla developmentu)

### 1. Uruchom tylko bazę danych w Docker

```bash
docker-compose -f docker-compose.dev.yml up -d
```

To uruchomi tylko PostgreSQL na porcie 5432.

### 2. Zainstaluj zależności

```bash
npm install
```

### 3. Wygeneruj Prisma Client i utwórz schemat w bazie

```bash
npm run db:push
```

### 4. Uruchom aplikację

```bash
npm run dev
```

### 5. Otwórz przeglądarkę

http://localhost:3000

---

## Zatrzymanie bazy danych

```bash
docker-compose -f docker-compose.dev.yml down
```

---

## Przydatne komendy

### Zobacz działające kontenery

```bash
docker ps
```

### Zobacz logi PostgreSQL

```bash
docker logs mathify-postgres
```

### Połącz się z bazą danych

```bash
docker exec -it mathify-postgres psql -U mathify -d mathify
```

### Otwórz Prisma Studio (GUI dla bazy)

```bash
npm run db:studio
```

---

## Troubleshooting

### Port 5432 jest zajęty

Jeśli masz już PostgreSQL lokalnie, możesz zmienić port w `docker-compose.dev.yml`:

```yaml
ports:
  - "5433:5432" # Zmień na inny port
```

Wtedy zaktualizuj DATABASE_URL w `.env`:

```
DATABASE_URL="postgresql://mathify:mathify_password@localhost:5433/mathify?schema=public"
```

### Błąd połączenia z bazą

Upewnij się, że kontener PostgreSQL działa:

```bash
docker ps | grep mathify-postgres
```

Jeśli nie działa, uruchom ponownie:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Błędy Prisma

Jeśli masz problemy z Prisma, spróbuj:

```bash
npm run db:generate
npm run db:push
```
