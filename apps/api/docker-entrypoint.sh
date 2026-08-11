#!/bin/sh
# Container entrypoint for the Steeze API.
# Applies pending Prisma migrations, then boots the Nest server.
set -e

cd /app/apps/api

echo "==> Applying database migrations"
./node_modules/.bin/prisma migrate deploy

if [ "$RUN_DB_SEED" = "true" ]; then
  echo "==> Seeding admin user"
  node prisma/seed-admin.js || echo "Seed skipped (non-fatal)"
fi

echo "==> Starting API"
exec node dist/src/main.js
