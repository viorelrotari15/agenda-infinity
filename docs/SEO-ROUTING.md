# Specialist public pages (`/p/:slug`) and routing

Search-friendly HTML for each specialist is served by the **API** (`GET /p/:slug`), not by the Vite SPA. In development, `vite` and `vite preview` proxy `/p/*` to the Nest process on port 3001 (see `apps/app/vite.config.ts`).

## Production (single hostname)

Put a reverse proxy (nginx, Caddy, Traefik, cloud load balancer) in front of the app and the API:

- `/p/*` → Nest (`PORT` 3001, or your API upstream)
- `/api/*` → Nest
- `/` and everything else → static SPA (Vite build)

Set environment variables on the API:

- `PUBLIC_APP_ORIGIN` — public site origin with no trailing slash, e.g. `https://book.example.com` (used for canonical URLs and the “Book” link on the landing page)
- `PUBLIC_SITE_NAME` — optional; defaults to `Agenda Infinity` (used in `<title>` when `seoTitle` is not set)

## Database migration

Apply Prisma migrations so `SpecialistProfile` includes `publicBio` and `seoTitle`:

```bash
pnpm --filter @agenda/api exec prisma migrate deploy
```

If the database existed before migrations were introduced, baseline or run the SQL in `apps/api/prisma/migrations/` as appropriate for your environment.
