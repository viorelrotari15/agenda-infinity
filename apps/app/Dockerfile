FROM node:24-alpine AS base
WORKDIR /workspace
RUN corepack enable

FROM base AS build
COPY . .
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @agenda/shared build && pnpm --filter @agenda/api-client build && pnpm --filter @agenda/app build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /workspace .
EXPOSE 5173
CMD ["pnpm", "--filter", "@agenda/app", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
