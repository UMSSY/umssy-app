# CLAUDE.md

Monorepo de UMSSY con dos workspaces independientes (pnpm, Node.js 22):

- `backend/` — API NestJS + Prisma 7 + PostgreSQL (Docker). Corre en `http://localhost:8080/api`, Swagger en `/docs`.
- `frontend/` — Next.js + Tailwind + shadcn/ui (Base UI, preset Nova).

Setup detallado: `README.md` (raíz), `backend/README.md` y `frontend/README.md`.

## Comandos frecuentes (backend)

```bash
docker compose up -d           # base de datos
pnpm run start:dev             # servidor en modo watch
pnpm migrate <nombre>          # nueva migración (tras editar schema.prisma)
pnpm migrate:apply             # aplicar migraciones + prisma generate
pnpm test                      # tests unitarios (vitest)
pnpm test:e2e                  # e2e (requiere .env.test con DB_SCHEMA=test)
pnpm lint                      # oxlint
pnpm lint:standards            # eslint
```

## Convenciones del backend

### Estructura de módulos NestJS

Cada módulo vive en `backend/src/modules/<nombre>/` (ver `auth` y `availability` como referencia):

```
modules/<nombre>/
├── <nombre>.module.ts
├── controllers/     # *.controller.ts — solo HTTP, delegan en el service
├── services/        # *.service.ts — lógica de negocio
├── repositories/    # *.repository.ts — único lugar que habla con Prisma
├── requests/        # *.schema.ts — esquemas Zod de entrada (+ tipo inferido)
├── exceptions/      # *.exception.ts + index.ts que las re-exporta
├── tests/           # *.spec.ts (controller, service, schema, exceptions, module)
└── mappers/, types/ # opcionales, según el módulo
```

- Flujo: controller → service → repository → `PrismaService`.
- El **Repository** es quien inyecta y usa `PrismaService` directamente (ver `auth.repository.ts`). El **Service** inyecta el Repository y lo llama; nunca inyecta ni usa Prisma directo.
- Los tests viven en `tests/` dentro del módulo (y `common/tests/` para código compartido), no junto al archivo fuente.
- Código transversal en `backend/src/common/` (`decorators`, `enums`, `exceptions`, `filters`, `guards`, `interceptors`, `pipes`, `prisma`, `utils`, `tests`).

### Excepciones

- Toda excepción de dominio hereda de `DomainException` (`common/exceptions/domain.exception.ts`), que recibe `message` y `statusCode`.
- Cada excepción va en su propio archivo `<nombre>.exception.ts` dentro de `exceptions/` del módulo, con mensaje por defecto, y se exporta desde `exceptions/index.ts`.
- `DomainExceptionFilter` (`common/filters`) las convierte en respuesta HTTP; no uses `HttpException` para errores de negocio.

```ts
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidCredentialsException extends DomainException {
  constructor(message = 'Correo o contraseña incorrectos') {
    super(message, 401);
  }
}
```

### Validación

- La validación de entrada usa **Zod** con `ZodValidationPipe` (`common/pipes/zod-validation.pipe.ts`).
- El esquema vive en `requests/<nombre>.schema.ts` y exporta también el tipo (`z.infer`).
- Se aplica en el controller: `@Body(new ZodValidationPipe(loginSchema)) body: LoginDto`.
- No uses `class-validator` / `class-transformer`.

### Imports con extensión `.js`

El código es TypeScript pero **todos los imports relativos llevan extensión `.js`** (ESM), nunca `.ts` ni sin extensión:

```ts
import { AuthService } from '../services/auth.service.js';
```

### Base de datos (Prisma)

- `PrismaService` vive en `common/prisma/prisma.service.ts` (módulo en `prisma.module.ts`) y es la forma estándar de conectarse a la base de datos. Inyéctalo solo en los repositories (nunca en services ni controllers); no crees `new PrismaClient()` en código de la app.
- La cadena de conexión se construye desde variables de entorno con `buildDatabaseConnectionString()` (`common/prisma/build-connection-string.ts`).
- **Única excepción:** `backend/prisma/seed.ts` mantiene su propia instancia de `PrismaClient` por decisión explícita de DevOps. No la migres a `PrismaService`.
- El cliente generado está en `src/prisma/client.js`.

### Roles

Los nombres de rol están centralizados en `common/enums/roles.enum.ts` (`ROLE_NAMES` y el tipo `RoleName`). Úsalos desde ahí (esquemas Zod, seed, servicios); no escribas strings de rol sueltos.

## Convenciones del frontend

- Organizado por módulos en `frontend/src/modules/<nombre>/` con `views/`, `hooks/`, `services/`, `types/` e `index.ts` (ver `modules/auth`).
- Componentes de UI con shadcn/ui: `pnpm dlx shadcn@latest add <componente>` (se agregan en `src/components/ui/`).

## Git

- **Ramas:** `feature/grupo-1-<descripcion>` (ej. `feature/grupo-1-login-provisional`). La rama principal de integración es `develop`.
- **Commits:** siempre en **inglés**, estilo Conventional Commits con scope opcional, p. ej. `feat(backend): add provisional role-based login`, `fix(backend): rename passwordHash to password`, `chore: remove docker install script from repo`.
