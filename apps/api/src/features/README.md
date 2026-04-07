# Features

This folder follows a feature-first layout compatible with clean architecture:

- Each feature owns its controllers, application services (use-cases), and any feature-local helpers.
- Cross-cutting, reusable helpers live in `src/shared/**`.
- Infrastructure adapters (Prisma, S3, etc.) will be grouped under `src/infra/**` as they are extracted.
