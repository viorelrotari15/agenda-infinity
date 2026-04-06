FROM node:24-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS build
# Dependency manifests only — keeps `pnpm install` cached when app source changes
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/app/package.json ./apps/app/
COPY packages/shared/package.json ./packages/shared/
COPY packages/api-client/package.json ./packages/api-client/
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @agenda/api exec prisma generate
RUN pnpm --filter @agenda/shared build && pnpm --filter @agenda/api-client build && pnpm --filter @agenda/api build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /workspace .
EXPOSE 3001
# Align legacy enum values, then push schema (see apps/api/prisma/sql/remap_legacy_booking_status.sql)
CMD ["sh", "-c", "pnpm --filter @agenda/api exec -- prisma db execute --file prisma/sql/remap_legacy_booking_status.sql || true; node apps/api/scripts/db-push.cjs && pnpm --filter @agenda/api run seed && pnpm --filter @agenda/api start"]
