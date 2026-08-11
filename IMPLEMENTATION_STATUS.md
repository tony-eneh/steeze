# Implementation Status

Last reviewed: 12 August 2026.

## Phases 1–6 (API + Admin)

Complete. During this pass three defects were found that made the deployed API
largely non-functional, and have been fixed:

- Every authenticated controller read the user id from `user.sub`, which does
  not exist on the request user object. All authenticated routes returned 500s
  in production. Controllers now use a typed `AuthenticatedUser`.
- Notification endpoints read `@CurrentUser('sub')`, which resolved to
  `undefined`. Prisma ignores undefined filters, so listing, counting and
  mark-all-read ran unscoped across every user's notifications.
- The container start command was configured in a way the platform exec'd as a
  single binary name, so deploys exited 127.

Added in the same pass:

- Password reset and email verification, with hashed single-use expiring tokens
- SMTP email delivery, falling back to logging when SMTP is unconfigured
- Media uploads (Cloudinary) and design image management
- Helmet, two-tier rate limiting, raw-body Paystack signature verification
- Liveness and readiness health endpoints

## Phase 5 (Notifications)

Complete. In-app notifications now fan out to push (FCM) and email. Device
tokens are registered and unregistered through the API, and tokens FCM reports
as unregistered are pruned. Both channels no-op when their credentials are
absent.

## Phase 7 (Mobile)

Feature pages, guards, interceptors and typed models are in place.

- Paystack checkout and return verification are wired end to end
- Push registration syncs the FCM token on sign-in and drops it on sign-out
- The build was broken by Angular Material's SCSS theming under pnpm; it now
  uses the prebuilt theme, matching the admin app

Remaining: Capacitor native platforms are not added, so push cannot be
exercised on a device yet. Several pages still show sample data rather than
live API responses. No mobile test coverage.

## Phase 8 (Landing)

Complete. All nine routes carry production copy, per-route SEO (title,
description, canonical, Open Graph, Twitter), organisation structured data,
`robots.txt` and a sitemap. Nine routes prerender.

A production build previously shipped the development environment because
`fileReplacements` was missing, so the deployed site pointed at a localhost API
URL. Fixed.

## Phase 9 (Polish, testing, deployment)

- API e2e coverage of the full happy path and the return path ✅
- Unit coverage of auth token flows and order pricing and commission ✅
- CI: lint, unit, e2e against a Postgres service, per-app build matrix ✅
- Security pass: helmet, rate limiting, webhook verification, CORS ✅
- Deployment playbook ([DEPLOYMENT.md](./DEPLOYMENT.md)) ✅

Remaining: no admin or mobile test coverage, and the API still carries lint
warnings where third-party payloads (Paystack, Open Tailor, Prisma JSON
columns) are untyped.
