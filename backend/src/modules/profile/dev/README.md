# Perfil (Epic 2): herramientas temporales de desarrollo

> **Carpeta temporal.** Solo existe para poder probar el módulo de perfil
> mientras el **Epic 1** (inicio de sesión y registro de usuarios) no esté
> listo. Cuando el Epic 1 publique su autenticación, esta carpeta se elimina
> (ver [Cuándo eliminar esta carpeta](#cuándo-eliminar-esta-carpeta)).
> Aquí también pueden ir prototipos temporales de integración con el Epic 3
> (radar de afinidad).

Contenido:

| Archivo | Para qué sirve |
| --- | --- |
| `current-user-id.decorator.ts` | Obtiene el id del usuario "logueado" desde el header HTTP `x-user-id`. |
| `current-user-id.decorator.spec.ts` | Pruebas unitarias del decorador. |
| `dev-profile-seed.sql` | Carga datos de prueba en **tu base local**: el catálogo de ciudades y una usuaria egresada de prueba. |

La parte del frontend está en `frontend/src/modules/profile/dev/README.md`.

---

## Cómo funciona la prueba mientras no existe el login

1. **No hay inicio de sesión todavía.** Para simular un usuario logueado, el
   frontend envía en cada petición del perfil el header
   `x-user-id: <id del usuario>`. El id lo toma de la variable
   `NEXT_PUBLIC_DEV_USER_ID` de `frontend/.env`.
2. **El backend lee ese header** con el decorador `CurrentUserId` de esta
   carpeta. Si falta o no es un UUID válido, responde `401` con el mensaje
   *"Debes iniciar sesión para continuar."*.
3. **El usuario tiene que existir en la tabla `users`.** El módulo de perfil
   **no crea usuarios**: solo lee y **actualiza** una fila que ya existe (esa
   fila la creará el registro del Epic 1). Para probar sin el Epic 1, el seed
   `dev-profile-seed.sql` inserta a la usuaria de prueba:

   | Campo | Valor |
   | --- | --- |
   | id | `00000000-0000-4000-8000-000000000001` |
   | Nombre | Valeria Quispe |
   | Correo institucional | `valeria.quispe@est.umss.edu` |

   Ese mismo id es el que se coloca en `NEXT_PUBLIC_DEV_USER_ID`.
4. **Las ciudades** se eligen de una lista porque `users.city_id` es una clave
   foránea a la tabla `cities`. Ninguna migración carga ciudades, por eso el
   seed inserta 12 ciudades de Bolivia.

Qué guarda cada pantalla (todo en la fila del usuario en `users`):

| Pantalla | Endpoint | Columnas |
| --- | --- | --- |
| Ver perfil | `GET /api/profile/me` | lectura |
| Lista de ciudades | `GET /api/profile/cities` | lectura de `cities` |
| Datos personales | `PATCH /api/profile/me/personal-info` | `first_name`, `last_name`, `city_id`, `phone`, `personal_email` |
| Presentación | `PATCH /api/profile/me/presentation` | `headline`, `about_me`, `interested_opportunities` |
| Fotografía | `PUT` / `DELETE /api/profile/me/photo` | `photo_url` (imagen guardada en bytes) |
| Ver fotografía | `GET /api/profile/:userId/photo` | lectura de `photo_url` |

> **Importante:** el header `x-user-id` **no es seguro** (cualquiera podría
> enviar el id de otra persona). Es solo para desarrollo local y nunca debe
> llegar a producción.

---

## Cómo correr el proyecto en tu PC

Requisitos: Node.js 22 (`nvm use`), pnpm y **Docker Desktop abierto** (debe
decir *Engine running*).

### 1. Backend y base de datos (terminal 1)

```bash
cd backend
pnpm install
```

Crea el archivo `.env` a partir de la plantilla (solo la primera vez):

| Terminal | Comando |
| --- | --- |
| CMD | `copy .env.example .env` |
| PowerShell | `Copy-Item .env.example .env` |
| Git Bash / Linux / macOS | `cp .env.example .env` |

Levanta PostgreSQL, aplica las migraciones y carga los datos de prueba:

```bash
docker compose up -d
pnpm migrate:apply
pnpm exec prisma db execute --file src/modules/profile/dev/dev-profile-seed.sql
pnpm start:dev
```

- `docker compose up -d` levanta el contenedor `umssy-db` (PostgreSQL).
- `pnpm migrate:apply` crea o actualiza todas las tablas.
- El comando del seed se puede ejecutar varias veces: no duplica datos
  (`ON CONFLICT DO NOTHING`) y solo afecta a **tu** base local.
- Cuando aparezca *Nest application successfully started*, la API está en
  `http://localhost:8080/api` y la documentación Swagger en
  `http://localhost:8080/docs`.

### 2. Frontend (terminal 2)

```bash
cd frontend
pnpm install
```

Crea `frontend/.env` a partir de `.env.example` (mismos comandos de la tabla
anterior) y **agrega al final** esta línea:

```bash
NEXT_PUBLIC_DEV_USER_ID=00000000-0000-4000-8000-000000000001
```

Luego:

```bash
pnpm dev
```

Abre:

- `http://localhost:3000/profile`: vista del perfil.
- `http://localhost:3000/profile/edit`: formularios de datos personales y
  presentación.

Para ver la versión de celular en el navegador: `F12` y luego `Ctrl+Shift+M`.

### 3. (Opcional) Ver los datos en DBeaver u otro cliente

| Campo | Valor (de `backend/.env`) |
| --- | --- |
| Host | `localhost` |
| Puerto | `5432` |
| Base de datos | `app_db` |
| Usuario | `user` |
| Contraseña | `password_db` |

```sql
SELECT u.first_name, u.last_name, u.phone, u.personal_email, c.title AS city,
       u.headline, u.about_me, u.interested_opportunities,
       u.photo_url IS NOT NULL AS has_photo
FROM users u
LEFT JOIN cities c ON c.id = u.city_id
WHERE u.id = '00000000-0000-4000-8000-000000000001';
```

---

## Problemas comunes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| *"Debes iniciar sesión para continuar."* | Falta `NEXT_PUBLIC_DEV_USER_ID` en `frontend/.env` | Agrega la variable y **reinicia** `pnpm dev` |
| *"No se encontró el perfil del egresado"* | La usuaria de prueba no existe en tu base | Ejecuta el comando del seed |
| La lista de ciudades está vacía | No se cargó el seed | Ejecuta el comando del seed |
| *"No se pudo conectar con el servidor"* | El backend no está corriendo o Docker está apagado | Abre Docker Desktop, luego `docker compose up -d` y `pnpm start:dev` |
| `pnpm migrate:apply` falla por datos antiguos | Tu base local tiene datos de una versión vieja del esquema | `pnpm exec prisma migrate reset` (**borra solo tu base local**) y vuelve a ejecutar el seed |
| Git muestra muchos archivos cambiados en `backend/src/prisma/` | `migrate:apply` regenera el cliente de Prisma (solo cambian los fines de línea) | No los incluyas en tus commits: `git checkout -- backend/src/prisma` |

---

## Cuándo eliminar esta carpeta

Cuando el Epic 1 tenga el inicio de sesión (JWT):

1. Reemplazar `CurrentUserId` por el guard o decorador del Epic 1, que lee el
   id del usuario desde el token, y borrar `current-user-id.decorator.ts` y su
   spec.
2. Quitar de `dev-profile-seed.sql` la inserción de la usuaria de prueba. Si
   el catálogo de ciudades todavía no lo carga nadie más, mover esa parte a
   donde el equipo defina.
3. Borrar `frontend/src/modules/profile/dev/` (ver su README).
4. Borrar esta carpeta.

Los endpoints, el servicio, las validaciones y las pantallas **no cambian**:
solo cambia de dónde sale el id del usuario.
