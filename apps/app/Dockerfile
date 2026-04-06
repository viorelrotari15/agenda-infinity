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
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @agenda/shared build && pnpm --filter @agenda/api-client build && pnpm --filter @agenda/app build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /workspace .
EXPOSE 5173
CMD ["pnpm", "--filter", "@agenda/app", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
