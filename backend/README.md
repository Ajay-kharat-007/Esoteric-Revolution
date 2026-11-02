# Esoteric Library Backend

Phase 0 foundation for the Esoteric Library REST API.

## Local setup

1. Copy `.env.example` to `.env` and use safe local credentials.
2. Start dependencies with `docker compose up -d postgres redis`.
3. Run `npm install`, `npm run prisma:generate`, and `npm run prisma:migrate:dev`.
4. Run `npm run start:dev`.
   Swagger is at `http://localhost:3000/docs`; health endpoints are `/health`, `/health/ready`, and `/version`.

## Verification

Run `npm run quality` for formatting, linting, types, tests, OpenAPI, Prisma validation, and build.
