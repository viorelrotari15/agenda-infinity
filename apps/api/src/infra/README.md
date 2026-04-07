# Infrastructure

Infrastructure adapters and framework glue:

- DB access (Prisma) module/services
- Object storage (S3/MinIO)
- External integrations (Firebase, Twilio, SMTP)

Features depend on abstractions where practical, and on concrete adapters when the app is small.
