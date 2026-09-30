# Perfil (Epic 2): herramientas temporales de desarrollo (frontend)

> **Carpeta temporal.** Solo existe para probar las pantallas de perfil
> mientras el **Epic 1** (inicio de sesión) no esté listo. Aquí también
> pueden ir prototipos temporales de integración con el Epic 3 (radar de
> afinidad).
>
> La guía completa para correr el proyecto, con el backend, la base de datos,
> los datos de prueba y los problemas comunes, está en
> **`backend/src/modules/profile/dev/README.md`**.

| Archivo | Para qué sirve |
| --- | --- |
| `dev-user.ts` | Agrega el header `x-user-id` a las peticiones del perfil, con el valor de `NEXT_PUBLIC_DEV_USER_ID`. |

## Cómo funciona

1. `profile.service.ts` llama a `buildDevUserHeaders()` en cada petición a
   `/api/profile/me/...`.
2. `buildDevUserHeaders()` lee `process.env.NEXT_PUBLIC_DEV_USER_ID` y, si
   existe, envía `x-user-id: <ese id>`. Si la variable no existe, no envía
   nada y el backend responde *"Debes iniciar sesión para continuar."*.
3. El backend busca ese id en la tabla `users` de tu base local. La usuaria
   de prueba la crea el seed del backend.

Las variables `NEXT_PUBLIC_*` se leen al iniciar Next.js: si cambias `.env`,
**reinicia `pnpm dev`**.

## Configuración en tu PC

1. Crea `frontend/.env` a partir de `.env.example`:

   | Terminal | Comando |
   | --- | --- |
   | CMD | `copy .env.example .env` |
   | PowerShell | `Copy-Item .env.example .env` |
   | Git Bash / Linux / macOS | `cp .env.example .env` |

2. Agrega al final de `frontend/.env`:

   ```bash
   NEXT_PUBLIC_DEV_USER_ID=00000000-0000-4000-8000-000000000001
   ```

   Es el id de la usuaria de prueba (Valeria Quispe) que crea el seed del
   backend. Puedes poner el id de cualquier otro usuario que exista en tu base
   local para "entrar" como ese usuario.

3. Con el backend corriendo (ver el README del backend):

   ```bash
   pnpm install
   pnpm dev
   ```

4. Abre `http://localhost:3000/profile` o `http://localhost:3000/profile/edit`.

## Notas de la interfaz

- Las pantallas fuerzan el tema claro del sistema de diseño, aunque el sistema
  operativo esté en modo oscuro.
- Todavía no existe el menú lateral ni la barra superior de la aplicación: son
  transversales (`shared/components/layout/`) y no pertenecen a este módulo.
  Cuando existan, estas pantallas se mostrarán dentro de ellos sin cambios.

## Cuándo eliminar esta carpeta

Cuando el Epic 1 tenga el inicio de sesión:

1. En `services/profile.service.ts`, reemplazar `buildDevUserHeaders` por el
   mecanismo de autenticación del Epic 1 (por ejemplo, que el `apiClient`
   compartido envíe el token).
2. Borrar esta carpeta y la variable `NEXT_PUBLIC_DEV_USER_ID` de tu `.env`.
