## Description

This repository contains the backend for the **UMSSY** application.

## Project Setup

1. Install dependencies:

```bash
pnpm install
```

2. Environment configuration:
   Create a `.env` file by copying the template file:

```bash
cp .env.example .env
```

> **Note:** For local development, using the default values in `.env` is sufficient. Feel free to update the environment variables as needed.

## Authentication Environment Variables

The backend refuses to start if any of the following variables is missing or empty (see `src/common/utils/validate-env.ts`). All of them are listed in `.env.example`.

| Variable         | Description                                                                                         | Example                 |
| ---------------- | --------------------------------------------------------------------------------------------------- | ----------------------- |
| `JWT_SECRET`     | Secret used to sign the access tokens. Use a long random value, e.g. `openssl rand -hex 32`.        | _(generated)_           |
| `JWT_EXPIRES_IN` | Token lifetime, as a duration string (`15m`, `8h`, `7d`) or a number of seconds.                    | `8h`                    |
| `JWT_ALGORITHM`  | Signing algorithm for the tokens (must be compatible with `JWT_SECRET`, e.g. `HS256`).              | `HS256`                 |
| `CORS_ORIGIN`    | Single origin allowed by CORS. It must be the URL where the frontend runs.                          | `http://localhost:3000` |

> **Note:** Never reuse the development `JWT_SECRET` in other environments, and never commit your `.env` file.

## Provisional Role-Based Login

Login is provisional and role-based: a user can hold several roles, and picks one when logging in.

- **Endpoint:** `POST /api/auth/login`
- **Body:** `{ "email": string, "password": string (min. 8 chars), "roleTag": "titulado" | "estudiante" | "mentor" | "empresa" | "administrativo" }`
- **Flow:**
  1. The user is looked up by email, along with their active roles.
  2. The password is checked with `bcrypt`. A wrong email or password returns `401`.
  3. The requested `roleTag` must be one of the user's assigned roles, otherwise it returns `403`.
  4. On success it returns `{ "accessToken": "<jwt>", "roleTag": "<role>" }` with status `201`.
- **Token payload:** `sub` (user id) and `roleTag` (the role chosen at login), signed with `JWT_SECRET`, `JWT_ALGORITHM` and `JWT_EXPIRES_IN`.

A test user is created by the seed (`prisma/seed.ts`): `prueba@umss.edu.bo` / `Prueba123` with the role `titulado`.

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prueba@umss.edu.bo","password":"Prueba123","roleTag":"titulado"}'
```

## Compile and Run the Project

1. Start the required services via Docker:

```bash
docker compose up -d
```

2. Run the application in **watch mode** (automatically reloads the server when code changes are saved):

```bash
pnpm run start:dev
```

you can visit the Swagger documentation in:
```
http://localhost:8080/docs
```

and the server runs in:
```
http://localhost:8080/api
```

## Database Migrations

Ensure your database container is running before executing migration commands.

- **Apply existing migrations:**

```bash
pnpm migrate:apply
```

- **Generate a new migration** (if you modified `schema.prisma`):

```bash
pnpm migrate <migration_name>
```

- **Generate Prisma Client:**

```bash
pnpm generate
```

## Run Tests

```bash
# Unit tests
pnpm run test

# End-to-end (E2E) tests
pnpm run test:e2e

# Run unit and E2E tests in parallel
pnpm run test:all

# Test coverage report
pnpm run test:cov
```
## Testing

Before running the tests, start the local database with `docker compose up -d postgres` and apply the migrations to `.env` with `pnpm migrate:apply`.

Then create a `.env.test` file by copying `.env.test.example`. Use the same credentials as your `.env` (`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT`) and keep `DB_SCHEMA=test`, so tests use a separate schema and don't affect your development data.

   Apply the migrations to the test schema (only the first time, or when new migrations are added):

```bash
   pnpm migrate:test:apply
```

   ## Resources
- [NestJS Documentation](https://docs.nestjs.com?utm_source=gemini) — Learn more about the framework.
- [NestJS Courses](https://courses.nestjs.com/?utm_source=gemini) — Official video courses for hands-on experience.
- [Prisma v7 Documentation](https://www.prisma.io/docs/orm/v7?utm_source=gemini) — Official ORM documentation.