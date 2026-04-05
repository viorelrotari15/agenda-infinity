# Agenda Infinity

Monorepo with:

- apps/api (NestJS + Prisma)
- apps/app (Ionic React + Capacitor + FullCalendar)
- packages/shared
- packages/api-client

## Quick start (local)

1. Install Node.js 20+
2. Install pnpm (`npm i -g pnpm`)
3. Run `pnpm install`
4. Copy env files from `.env.example`
5. Run `pnpm db:push`
6. Run `pnpm dev`

## Backend with Docker Compose

Run backend stack (API + PostgreSQL + Redis):

```bash
docker compose up --build -d
```

Stop stack:

```bash
docker compose down
```

Useful logs:

```bash
docker compose logs -f api
```

API URL: `http://localhost:3000/api`
Postgres: `localhost:5432` (`postgres/postgres`, db `agenda_infinity`)
Redis: `localhost:6379`
