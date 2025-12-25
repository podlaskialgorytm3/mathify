# Mathify - Docker Setup

## Quick Start

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Update `.env` file with your credentials (especially GEMINI_API_KEY and EMAIL settings)

3. Start all services:

```bash
docker-compose up -d
```

4. Access the application:

- Application: http://localhost:3000
- Database: localhost:5432

## Docker Commands

### Start services

```bash
docker-compose up -d
```

### Stop services

```bash
docker-compose down
```

### View logs

```bash
docker-compose logs -f app
```

### Restart services

```bash
docker-compose restart
```

### Rebuild and start

```bash
docker-compose up -d --build
```

### Access database

```bash
docker exec -it mathify-postgres psql -U mathify -d mathify
```

### Run Prisma commands

```bash
docker exec -it mathify-app npm run db:studio
docker exec -it mathify-app npm run db:migrate
```

## Development without Docker

If you prefer to run without Docker:

1. Install PostgreSQL locally
2. Update DATABASE_URL in .env
3. Run:

```bash
npm install
npm run db:push
npm run dev
```
