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

# Test coverage report
pnpm run test:cov

```

## Resources

- [NestJS Documentation](https://docs.nestjs.com?utm_source=gemini) — Learn more about the framework.
- [NestJS Courses](https://courses.nestjs.com/?utm_source=gemini) — Official video courses for hands-on experience.
- [Prisma v7 Documentation](https://www.prisma.io/docs/orm/v7?utm_source=gemini) — Official ORM documentation.