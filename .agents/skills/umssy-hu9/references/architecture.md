# Arquitectura actual y puntos de cambio — HU-MEN-09

**Fuente:** inspección de `develop` en `UMSSY/umssy-app`, commit `a6e3f4bda9670e70a8e615ccae0e472b3825bbd1` (consulta 24/10/2026). Comprobar cambios posteriores antes de programar.

## Backend — NestJS, Prisma 7, PostgreSQL

- `backend/src/modules/mentors/controllers/mentors.controller.ts`: `@Controller('mentors')`, `GET /mentors` devuelve listado, `GET /mentors/:userId` consulta perfil; `ResponseInterceptor` estandariza la respuesta. `JwtAuthGuard` solo en rutas privadas actuales. **Si se agrega `GET /mentors/directory`, declarar antes de `GET /mentors/:userId` y protegerlo para obtener el usuario autenticado.**
- `backend/src/modules/mentors/services/mentors.service.ts`: `findAll()` → `findActiveMentors(new Date())` → `MentorMapper.toDirectoryResponseList`.
- `backend/src/modules/mentors/repositories/mentors.repository.ts`: `prisma.user.findMany` filtra `isActive`, rol `mentor` vigente, e incluye nombre, headline, disponibilidad, educación, áreas y orientaciones; orden por `firstName`, `lastName`. No pagina actualmente.
- `backend/src/modules/mentors/mappers/mentor.mapper.ts`: respuesta existente `{ id, fullName, headline, photoUrl, education, isAvailable, technicalAreas, orientationTypes }`. Preservar campos y resolución de fotos.
- `backend/src/modules/skills/repositories/user-skill.repository.ts`: consulta `UserSkill` por `userId`, `Skill.id` y `Skill.name`.
- `backend/src/modules/skills/controllers/user-skill.controller.ts`: `GET /profile/me/skills`, con JWT. La ruta se orienta al usuario autenticado.
- `backend/src/modules/technical-areas/controllers/technical-areas.controller.ts`: `GET /technical-areas` catálogo completo, útil para filtro independiente de la página.
- `backend/prisma/schema.prisma`: `User`, `Skill`, `UserSkill`, `TechnicalArea`, `MentorTechnicalArea` (catálogos independientes). `Skill.areaId` referencia `RadarArea`, no `TechnicalArea`.
- `backend/src/modules/technical-areas/constants/seed-technical-areas.constants.ts`: catálogo de ocho áreas de Mentorías. `backend/src/modules/profile/constants/radar-areas.constants.ts` define categorías diferentes para radar. Para HU9 usar correspondencias explícitas: ver `skill-area-catalog.md`.
- Pruebas: `backend/src/modules/mentors/tests/*.spec.ts` y `backend/src/modules/skills/tests/*.spec.ts`.

Respetar capas Controller → Service → Repository/Mapper y validaciones de request según convenciones de cada módulo. No agregar un microservicio de afinidad ni asumir una tabla inexistente. Se ha acordado construir un catálogo explícito Epic 2 Skills → Epic 6 Technical Areas, preferentemente una constante de dominio probada sin nuevas migraciones.

## Frontend — Next.js 16.3.5 / React 19

- `frontend/src/modules/mentorship/views/mentor-directory-view.tsx`: actualmente estados `search`, `area`, `isAvailableOnly` con `useState`, filtra la **lista completa en cliente** y muestra `MentorDirectoryGrid`.
- `frontend/src/modules/mentorship/hooks/use-mentor-directory.ts`: TanStack Query con key `['mentorship','directory']`; al paginar deberá incorporar parámetros en queryKey.
- `frontend/src/modules/mentorship/services/mentor-directory.service.ts`: `GET /mentors` obtiene `ApiResponse<MentorDirectoryItem[]>`; resuelve photoUrl. NO cambiar este retorno a objeto paginado sin adaptar todos sus consumidores o preservar compatibilidad.
- `frontend/src/modules/mentorship/types/mentor-directory.types.ts`: `MentorDirectoryItem` y campos existentes.
- `frontend/src/modules/mentorship/components/mentor/mentor-directory-grid.tsx`: dos columnas con container queries en ancho suficiente.
- `frontend/src/modules/mentorship/components/mentor/mentor-card.tsx`: conserva foto, disponibilidad, educación, áreas, orientaciones y `Ver perfil`. Solo añadir badge condicional previsto.
- `frontend/src/modules/mentorship/components/mentor/mentor-profile-navigation.tsx`: enlace estático hacia `/mentorship/mentors`, debe conservar la query del directorio.
- `frontend/src/modules/mentorship/views/mentor-profile-view.tsx`: renderiza navegación y perfil; no convertir HU9 en rediseño general.
- `frontend/src/components/ui/pagination.tsx`: reutilizar controles existentes con `Button`/links sin comprometer accesibilidad.
- `frontend/src/modules/mentorship/views/mentor-directory-view.test.tsx`: pruebas del directorio existentes; mantenerlas y agregar casos HU9.
- `frontend/src/shared/types/api-response.types.ts`: `ApiResponse<T>` envuelve el dato en `data`; ya existe `PaginatedData<T>` con `items` y `totalItems`.

## Dependencias técnicas a vigilar

1. **Filtros actuales son locales**. Con datos paginados, filtrar solo las seis tarjetas rompería el contador y las páginas. Cambiar el conjunto completo al backend.
2. **Catálogo de áreas**. Ya existe `GET /technical-areas`. No construir el selector a partir de `items` de una sola página.
3. **Pérdida de filtros al volver**. Se reprodujo AC-02.3 antes de HU9; HU9-05 incorpora su solución.
4. **Colisiones entre desarrolladores**. Dev 2 y Dev 3 no deben editar simultáneamente las mismas líneas de `mentor-directory-view.tsx` sin coordinación.
5. **Rendimiento**. No implementar una consulta por mentor (N+1) cuando se obtengan habilidades y coincidencias.
6. **Autenticación**. Para afinidad no aceptar un `userId` sin autorizar enviado por el cliente. Tomarlo del JWT.
