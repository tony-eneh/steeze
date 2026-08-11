# Steeze API Dockerfile
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS builder
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml* ./
COPY turbo.json ./

# Copy API app
COPY apps/api/ ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Prisma config requires DATABASE_URL even for generate (no DB connection at build time)
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

# Generate Prisma client
RUN cd apps/api && pnpm exec prisma generate

# Build API
RUN pnpm --filter api build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --chown=nestjs:nodejs apps/api/docker-entrypoint.sh /usr/local/bin/steeze-api

# Normalise line endings and make the entrypoint executable regardless of the
# checkout that produced it (Windows clones can carry CRLF).
USER root
RUN sed -i 's/\r$//' /usr/local/bin/steeze-api && chmod +x /usr/local/bin/steeze-api
USER nestjs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["/usr/local/bin/steeze-api"]
