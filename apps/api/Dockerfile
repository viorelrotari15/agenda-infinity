FROM node:24-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS build
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @agenda/api exec prisma generate
RUN pnpm --filter @agenda/shared build && pnpm --filter @agenda/api-client build && pnpm --filter @agenda/api build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /workspace .
EXPOSE 3001
CMD ["sh", "-c", "pnpm db:push && pnpm db:seed && pnpm --filter @agenda/api start"]
