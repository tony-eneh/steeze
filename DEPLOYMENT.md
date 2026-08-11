# Deployment

How each Steeze app is built and shipped, and what has to be true in the
environment for it to work.

## What runs where

| App | Path | Host | URL |
|-----|------|------|-----|
| API (NestJS) | `apps/api` | Render (Docker web service `steeze-api`) | https://steeze-api.onrender.com |
| Landing (Angular SSR) | `apps/landing` | Vercel / any Node host | https://steeze.com |
| Admin (Angular SPA) | `apps/admin` | Vercel / any static host | https://admin.steeze.com |
| Mobile (Ionic) | `apps/mobile` | Web build, or Capacitor for stores | – |

Postgres is a Render managed instance. Redis is expected at `REDIS_URL`.

---

## API

### Build and start

The image is built from `apps/api/Dockerfile` with the **repo root** as the
Docker context, because the build needs `pnpm-workspace.yaml` and the root
lockfile.

The container's `CMD` runs `apps/api/docker-entrypoint.sh`, which applies
pending Prisma migrations and then starts the server. Nothing else should be
put in the platform's start-command field: Render passes that value through
without stripping quotes, so a quoted inline shell command is exec'd as a
single binary name and the container exits 127. **Leave the Render start
command empty** so the image's `CMD` is used.

### Health checks

- `GET /api/v1/health` – liveness, no dependencies touched.
- `GET /api/v1/health/ready` – readiness, includes a database round trip.

Set the Render health check path to `/api/v1/health`.

### Required environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | yes | Postgres connection string |
| `REDIS_URL` | yes | Boot fails without it |
| `JWT_SECRET` | yes | Access token signing key |
| `JWT_REFRESH_SECRET` | yes | Must differ from `JWT_SECRET` |
| `JWT_EXPIRES_IN` | no | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | no | Default `7d` |
| `CORS_ORIGINS` | yes in prod | Comma-separated browser origins, e.g. `https://steeze.com,https://admin.steeze.com`. localhost is always allowed |
| `PLATFORM_URL` | yes in prod | Base URL used in emailed links |
| `PLATFORM_NAME` | no | Default `Steeze` |
| `PAYSTACK_SECRET_KEY` | for payments | Server-side Paystack key |
| `PAYSTACK_WEBHOOK_SECRET` | for payments | Used to verify webhook signatures |
| `PAYMENT_CALLBACK_URL` | no | Where Paystack returns the customer. Defaults to `${PLATFORM_URL}/payment/callback` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | for email | Without these, email is logged instead of sent |
| `EMAIL_FROM` | no | Default `noreply@steeze.com` |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | for uploads | Without these, `POST /media/upload` returns 503 |
| `FIREBASE_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | for push | Without these, push delivery is a no-op |
| `RUN_DB_SEED` | no | Set to `true` to run the seed step on boot |

Optional integrations degrade to no-ops rather than failing at boot, so the API
starts with only the four required variables set.

### Paystack webhook

Point the Paystack dashboard webhook at:

```
https://steeze-api.onrender.com/api/v1/payments/webhook
```

Signatures are verified against the raw request body. Do not put a proxy in
front that re-serialises JSON, or verification will fail.

### Migrations

Migrations are applied by the entrypoint on every boot, so a deploy that
includes a migration applies it before the server accepts traffic. To run one
by hand:

```bash
pnpm --filter api exec prisma migrate deploy
```

---

## Landing (Angular SSR)

```bash
pnpm --filter landing build
```

Produces `apps/landing/dist/landing` with a `browser/` bundle, a `server/`
bundle and prerendered HTML for all nine routes. Serve with `server.ts` (Node)
or deploy the directory to a host with Angular SSR support.

`apps/landing/src/environments/environment.prod.ts` carries the production API
URL and the canonical site URL used for SEO tags. Both are swapped in by the
`production` build configuration; a build without that configuration ships
localhost URLs.

`robots.txt` and `sitemap.xml` are emitted at the site root. Update the
sitemap when routes are added.

---

## Admin (Angular SPA)

```bash
pnpm --filter admin build
```

Deploy `apps/admin/dist/admin/browser` as a static site with SPA rewrites (all
paths to `index.html`). The API URL comes from
`apps/admin/src/environments/environment.prod.ts`.

Whatever origin it lands on must be in the API's `CORS_ORIGINS`.

---

## Mobile (Ionic)

```bash
pnpm --filter mobile build
```

Produces a web build in `apps/mobile/dist/mobile/browser`. For app stores, add
the Capacitor native platforms and sync:

```bash
pnpm --filter mobile exec cap add android
pnpm --filter mobile exec cap add ios
pnpm --filter mobile exec cap sync
```

Push notifications need the Firebase config files (`google-services.json`,
`GoogleService-Info.plist`) added to the native projects, matched by the
`FIREBASE_*` variables on the API. On web, push registration is a no-op.

---

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request:

- **lint** – `pnpm lint` across the workspace
- **unit** – `pnpm --filter api test`
- **e2e** – API e2e suite against a Postgres service container
- **build** – matrix build of api, admin, mobile and landing

The e2e job runs `prisma migrate deploy` against the service container before
the suite. Adding a migration therefore also exercises it in CI.

---

## Release checklist

1. CI is green on `main`.
2. Any new environment variable is set on the host **before** the deploy that
   reads it.
3. New client origins are added to `CORS_ORIGINS`.
4. `GET /api/v1/health/ready` reports `database: up` after the deploy.
5. Paystack webhook still points at the current API URL.

## Rollback

Render keeps previous images; redeploy the last known-good deploy from the
dashboard. Prisma migrations are not automatically reversed, so a rollback
across a schema change needs a compensating migration rather than just an
image rollback.
