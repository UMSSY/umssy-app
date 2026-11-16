# Project Standards

## 1. BACKEND ARCHITECTURE AND STANDARDS

### 1.1 Technology Stack and Architecture Pattern

- **Technologies:** NestJS, Prisma ORM, PostgreSQL.
- **Architecture:** Modular monolith.

### 1.2 Layer and Module Responsibilities

#### Controllers

- Receive incoming HTTP requests already validated by Zod schemas.
- Call the corresponding module service method.
- Must never contain business logic. Global interceptors handle the final response format.

#### Services

- Contain 100% of the module's business logic.
- Are the only components allowed to inject repositories to read or save information. They must not inject `PrismaService` or interact directly with the database.
- Perform calculations and complex transformations, and throw custom business exceptions.

#### Exception Filters

- Catch custom exceptions thrown by services.
- Map and format errors into a standardized JSON structure with an HTTP status code and explanatory message.
- Use only one exception per file.

#### Interceptors

- Capture successful responses returned by controllers.
- Automatically wrap data in the application's unified format.

#### Schemas and Validation (Zod)

Define the exact structure and types of input data for create and update operations. They replace traditional annotation-based validation.

### 1.3 Rules for Module Interaction

- **No direct access:** A module must not query another domain's database tables or schemas directly.
- **Exclusive communication path:** To access another domain's data, inject the required module's service into the requesting module's service.
- Each module encapsulates its own business exceptions.

### 1.4 Naming and File Standards

Directories use lowercase kebab-case. File names follow the NestJS standard:

```text
Controllers: module-name.controller.ts
Services: module-name.service.ts
Modules: module-name.module.ts
Schemas: module-name.schema.ts
Exceptions: module-name.exceptions.ts
```

Custom exception classes must end with `Exception`, for example `UserNotFoundException`.

### 1.5 Example File Structure

```text
backend/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── main.ts
│   ├── app.module.ts                          # Root module: registers filters, domain modules, and configuration
│   ├── config/                                # Environment configuration and validation
│   │   ├── configuration.ts                   # Loads typed variables from .env
│   │   └── env.validation.ts                  # Zod schema for startup environment validation
│   ├── common/                                # Cross-cutting infrastructure, outside business domains
│   │   ├── database/
│   │   │   └── seeds.ts                       # Runs each module's seeds
│   │   ├── exceptions/
│   │   │   └── domain.exception.ts            # Abstract DomainException base class
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts       # Catches native Nest HttpException errors
│   │   │   ├── prisma-exception.filter.ts
│   │   │   └── domain-exception.filter.ts     # Catches DomainException and its subclasses
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts        # Wraps successful responses in the standard format
│   │   ├── pipes/
│   │   ├── decorators/
│   │   ├── guards/                            # Authentication and authorization guards
│   │   ├── prisma/
│   │   │   ├── build-connection-string.ts
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── utils/                             # Pure date, string, and pagination helpers
│   │   └── tests/                             # Cross-cutting infrastructure tests
│   │       └── response.interceptor.spec.ts
│   ├── prisma/                                # Generated Prisma Client
│   │   ├── internal/
│   │   ├── models/
│   │   ├── browser.ts
│   │   ├── client.ts
│   │   ├── commonInputTypes.ts
│   │   ├── enums.ts
│   │   └── models.ts
│   └── modules/                               # Business logic organized by domain
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── controllers/
│       │   │   └── auth.controller.ts          # Login, registration, and refresh endpoints
│       │   ├── services/
│       │   │   └── auth.service.ts             # Authentication rules, hashing, and tokens
│       │   ├── repositories/
│       │   │   └── auth.repository.ts          # Data access through PrismaService
│       │   ├── mappers/
│       │   │   └── auth.mapper.ts              # Transforms entities into responses using Zod
│       │   ├── requests/
│       │   │   ├── login.request.ts            # Zod schema for the login body
│       │   │   └── register.request.ts         # Zod schema for the registration body
│       │   ├── types/                          # Inferred types, internal contracts, and enums
│       │   │   └── auth.types.ts               # Internal domain interfaces and types
│       │   ├── exceptions/
│       │   │   └── auth.exceptions.ts          # InvalidCredentialsException
│       │   ├── interceptors/                   # Only when the domain needs its own interceptor
│       │   │   └── mentors-cache.interceptor.ts
│       │   └── tests/                          # Auth domain unit tests
│       │       ├── auth.service.spec.ts
│       │       ├── auth.repository.spec.ts
│       │       ├── auth.mapper.spec.ts
│       │       └── auth.controller.spec.ts
│       ├── users/
│       │   └── seeds/
│       │       └── users.seed.ts               # Initial module data
│       └── mentors/
└── test/                                      # End-to-end and integration tests
    ├── mentors.e2e-spec.ts
    └── jest-e2e.json
```

## 2. DATABASE STANDARDS AND ARCHITECTURE (PRISMA & POSTGRESQL)

### 2.1 Governance

Only the Database team modifies `schema.prisma` and migrations (`backend/prisma`, protected by CODEOWNERS). Other teams request changes through issues. Migrations are applied automatically during deployment.

### 2.2 Dual Naming Standard

Using `@map` and `@@map` is mandatory so that code and database each follow their own conventions.

| Element | Prisma | PostgreSQL |
| --- | --- | --- |
| Model / table | Singular, PascalCase (`EventRegistration`) | Plural, snake_case (`event_registrations`) |
| Field / column | camelCase (`firstName`) | snake_case (`first_name`) |
| Primary key | `id` | `id` |
| Foreign key | camelCase with the `Id` suffix (`cityId`) | snake_case with the `_id` suffix (`city_id`) |
| Relation | Singular for N:1 and 1:1 (`city`), plural for 1:N (`events`) | Not applicable |

### 2.3 Data Types

- Every ID is a `String` with `@id @default(uuid()) @db.Uuid`. Foreign keys also use `@db.Uuid`.
- Date and time: `@db.Timestamptz(6)`. Date only: `@db.Date`. Time only: `@db.Time(6)`.
- Text with a length limit uses `@db.VarChar(n)`.

### 2.4 Catalogs Instead of Enums

Values that change infrequently (statuses, modalities, sources, degree programs, document types) are catalog tables with `id`, unique `title`, `description`, and audit fields, rather than Prisma enums. This allows values to be added without schema migrations. In code, reference the value through a TypeScript enum in the module.

### 2.5 Relations and Deletion

- Every foreign key has an `@@index`.
- Join tables have their own `id` and an `@@unique` constraint on the two related IDs.
- Always define `onDelete`: `Cascade` for data belonging to the user, `Restrict` for catalogs and references that must not be deleted while in use, and `SetNull` for optional traceability references.
- If a model has two relations to the same model, name them in PascalCase (`"AppointmentMentor"`).

### 2.6 Auditing

Every table includes `createdAt` with `@default(now())` and `updatedAt` with `@updatedAt`, both with `@map` and `@db.Timestamptz(6)`. Tables with soft deletion add `deletedAt`.

### 2.7 Language

Tables, columns, relations, and catalog values are declared in English. Seeds may be in Spanish.

Example:

```prisma
model EventRegistration {
  id        String   @id @default(uuid()) @db.Uuid
  eventId   String   @map("event_id") @db.Uuid
  statusId  String   @map("status_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  event  Event              @relation(fields: [eventId], references: [id], onDelete: Cascade)
  status RegistrationStatus @relation(fields: [statusId], references: [id], onDelete: Restrict)

  @@index([statusId])
  @@map("event_registrations")
}
```