# Steeze Monorepo

Steeze is a marketplace platform connecting fashion designers with customers. This repo contains the NestJS API, Angular admin app, Ionic mobile app, and Angular landing page.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop (for Postgres/Redis/MinIO)

## Local Setup

1) Install dependencies

- From the repo root:
  - `pnpm install`

2) Start infrastructure (Postgres, Redis, MinIO)

- From the repo root:
  - `docker compose -f docker/docker-compose.yml up -d`

3) Configure environment variables

- Copy the example env file and update values as needed:
  - `copy .env.example .env`
- For the API app, create `apps/api/.env` (if not already present) and set at least:
  - `DATABASE_URL=postgresql://steeze:steeze@localhost:5432/steeze?schema=public`
  - `REDIS_URL=redis://localhost:6379`
  - `JWT_SECRET=your-secret`
  - `JWT_REFRESH_SECRET=your-refresh-secret`

4) Run database migrations

- From the repo root:
  - `pnpm db:migrate`

5) Seed the database

- From the repo root:
  - `pnpm --filter api exec prisma db seed`

6) Start development servers

- Run all apps:
  - `pnpm dev`

- Or run only the API:
  - `pnpm --filter api dev`

## Useful Scripts (root)

- `pnpm dev` — run all apps in dev mode
- `pnpm build` — build all apps
- `pnpm lint` — lint all packages
- `pnpm test` — run tests
- `pnpm db:generate` — generate Prisma client (API)
- `pnpm db:migrate` — run Prisma migrations (API)

## Repo Structure

```
apps/
  api/        NestJS + Prisma API
  admin/      Angular admin dashboard
  mobile/     Ionic mobile app (Angular)
  landing/    Angular landing page (SSR)
packages/
  shared/     Shared types/constants/utils
```

## Notes

- API base path: `/api/v1`
- Prisma schema: `apps/api/prisma/schema.prisma`
- Default seeded admin: `admin@steeze.com` / `Admin123!`
