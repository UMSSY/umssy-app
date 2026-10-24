# Catálogo de correspondencia — habilidades Epic 2 ↔ áreas Mentorías Epic 6

## Fuentes reales comprobadas en `develop`

- `backend/prisma/schema.prisma`: `Skill` y `UserSkill` de Epic 2; `TechnicalArea` y `MentorTechnicalArea` de Epic 6. Son entidades y relaciones distintas.
- `backend/src/modules/skills/seeds/skills-catalog.seed.ts`: habilidades profesionales catalogadas (`NestJS`, `Next.js`, `Spring Boot`, HTML5, etc.) además de `SEED_JOB_OFFER_SKILLS`.
- `backend/src/modules/technical-areas/constants/seed-technical-areas.constants.ts`: áreas oficiales **Backend, Desarrollo Web, Bases de Datos, QA, Datos, Cloud, Redes, Arquitectura**.
- `backend/src/modules/profile/constants/radar-areas.constants.ts`: `RadarArea` es un catálogo **separado** de áreas para radar y NO es la misma identidad que `TechnicalArea`.

## Modelo funcional elegido

La skill ordena convertir el conjunto de habilidades profesionales del egresado en un conjunto **deduplicado** de áreas de Mentorías y compararlo con las áreas declaradas por cada mentor. Las fuentes son reales, pero **la tabla exacta de equivalencias es una decisión funcional del equipo**; no existe materializada en Prisma al momento de esta revisión.

Ejemplo de **propuesta inicial para discutir**, **NO aprobar automáticamente**:

| Habilidad profesional Epic 2 | Área Mentorías candidata | Comentario |
|---|---|---|
| Node.js, NestJS, Spring Boot | Backend | Tecnologías de servidor |
| HTML5, CSS3, React, Next.js | Desarrollo Web | Desarrollo de interfaz/web; Next.js también tiene servidor, asignación única inicial sugerida |
| SQL, PostgreSQL, MongoDB, Redis | Bases de Datos | Tecnologías de almacenamiento y consultas |
| Docker, Kubernetes | Cloud | Contenedores e infraestructura |
| Python, JavaScript, TypeScript, Git, Linux | **Sin asignar todavía** | Versátiles; evitar equivalencias amplias no autorizadas |
| Habilidades personalizadas `Seed: ...` u otras custom | **Sin asignar todavía** | No inferir por similitud del texto |

**No interpretar el ejemplo como regla aprobada.** Primero ratificar si las habilidades de múltiples áreas pueden contribuir a más de un área y documentar cada equivalencia permitida.

## Diseño técnico sugerido

Ubicar una constante declarativa en el módulo de mentores (nombre orientativo):

`backend/src/modules/mentors/constants/skill-to-technical-area.catalog.ts`

- Claves estables por nombre canónico de `Skill.name` o identificadores estables acordados; resolver a nombres únicos existentes de `TechnicalArea` y, después, a IDs reales del catálogo. **No fabricar IDs**.
- Tests de correspondencia, cobertura de nombres oficial, skills desconocidas y duplicados.
- El catálogo no debe agregar permisos ni modificar registros de Epic 2.
- Prohibido mapear texto libre con coincidencias parciales (`includes('cloud')`, clasificación automática opaca) como si fueran equivalencias aprobadas.
- No reusar `Skill.areaId` directamente: es clave foránea hacia `RadarArea` y no hacia `TechnicalArea`.

## Prueba funcional clave

Habilidades `{NestJS, Spring Boot, Docker}` → áreas `{Backend, Cloud}` (no `{Backend, Backend, Cloud}`). Mentor con `{Backend, Cloud}` → resultado `2`, no `3`.

Un usuario sin skills debe recibir mensaje de añadir habilidades. Un usuario con skills sin equivalencia aprobada debe recibir un mensaje diferente, sin bloquear la navegación A–Z.

## Registro de ratificación del equipo

| Campo | Estado |
|---|---|
| Enfoque Epic2 UserSkill → catálogo → Epic6 TechnicalArea | **ACORDADO PARA HU9** |
| Catálogo exacto de pares habilidad/área | **POR RATIFICAR** |
| Responsable del catálogo | **POR ASIGNAR** |
| Revisión de QA/PO sobre ejemplos y mensaje sin correspondencias | **POR CONFIRMAR** |

No cerrar HU9-01 sin documentar el catálogo real que se implementó y demostrar la prueba 2–1–0.
