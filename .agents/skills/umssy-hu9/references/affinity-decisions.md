# Afinidad HU9 — decisión funcional y algoritmo del equipo

## Alcance confirmado para esta versión

El origen del interés del egresado son las **habilidades profesionales de Epic 2**, almacenadas como `UserSkill` → `Skill`. Las opciones con las que se compara son las **áreas técnicas del mentor** de Epic 6, `MentorTechnicalArea` → `TechnicalArea`. **Se necesita un catálogo de correspondencia explícito** entre ambos dominios.

**No usar la intersección simple entre habilidades de los dos usuarios como algoritmo principal.** Tampoco comparar `Skill.id` con `TechnicalArea.id`: son identidades distintas. En `develop`, `Skill.areaId` referencia `RadarArea`, no `TechnicalArea`. Los grupos de radar (`Desarrollo de Software`, `Cloud & DevOps`, `Datos & IA`, etc.) no son equivalentes 1:1 a las ocho áreas técnicas de Mentorías.

El catálogo debe basarse en nombres/identificadores canónicos de habilidades profesionales de Epic 2 y los nombres/IDs reales de `TechnicalArea` de Epic 6; ver `skill-area-catalog.md`. Los ejemplos no sustituyen la validación funcional del catálogo por el equipo y, si corresponde, QA/PO.

## Definición del conteo

1. Identificar al egresado autenticado por JWT en el backend (nunca aceptar `userId` libre desde query para medir sus habilidades).
2. Cargar sus habilidades profesionales desde `UserSkill` y `Skill`, deduplicadas por `Skill.id`.
3. Transformar cada habilidad **reconocida en el catálogo** en una o varias áreas técnicas existentes. Utilizar una relación explícita aprobada; no adivinar por nombres parecidos. El conjunto final de áreas debe quedar **sin duplicados**.
4. Para cada mentor activo filtrado, obtener `MentorTechnicalArea` y construir su conjunto de áreas técnicas (sin duplicados).
5. Calcular `sharedInterestsCount = |areasDelEgresado ∩ areasDelMentor|`. Una misma área cuenta **una vez**, aunque el egresado posea NestJS, Node.js y Spring Boot y las tres estén relacionadas con Backend.
6. Aplicar filtros primero; ordenar toda la lista resultante por `sharedInterestsCount` descendente, con desempate alfabético A–Z y UUID ascendente; paginar después (seis por página).
7. Si el usuario no tiene ninguna habilidad profesional, devolver resultados en A–Z y señalizar `no_skills` para el mensaje de QA. Si tiene habilidades pero ninguna mapeable, usar `unmapped_skills`; no fingir que carece de perfil. Si las tiene mapeables y los mentores comparten cero, no filtrar ningún mentor: todos se muestran en A–Z por desempate.
8. No contar la coincidencia por cada habilidad; la unidad del ejemplo QA es **área técnica compartida**. La UI puede mostrar `2 intereses en común` si hay dos áreas compartidas, conservando exactamente las palabras aprobadas.

## Ejemplo obligatorio

- Egresado: habilidades `NestJS`, `Docker` → catálogo aprobado para el ejemplo: `NestJS → Backend`, `Docker → Cloud` → intereses/áreas deducidas `{Backend, Cloud}`.
- Mentor A: `{Backend, Cloud, Arquitectura}` → **2**.
- Mentor B: `{Backend}` → **1**.
- Mentor C: `{Datos}` → **0**.
- Orden por afinidad: **A, B, C**.

Las dos correspondencias indicadas arriba son ilustrativas y deben figurar expresamente en el catálogo aprobado para que el escenario sea una prueba del sistema, no un supuesto.

## Implementación de alcance controlado

- Priorizar un **catálogo declarativo versionado en backend** (constante TypeScript probada, con keys validadas contra los catálogos oficiales) para HU9; **no introducir migración ni alterar el esquema Prisma** sin una necesidad documentada y coordinación con el equipo de BD.
- Resolver las habilidades del usuario una vez por consulta; cargar áreas de mentores de manera agrupada, **sin N+1**. No cargar fotos binarias completas para el directorio.
- Respetar `UserSkill` real: su `verificationStatus`, `isHighRelevance`, `source` y `Skill.isCustom` existen, pero **no filtrar ni ponderar por esos campos** hasta que un criterio los exija; tratar todos los skills válidos del usuario de modo consistente.
- Catálogo incompleto no es motivo para inventar asignaciones. Registrar habilidades sin correspondencia en pruebas/métricas no sensibles, para futura revisión.
- Si una habilidad corresponde justificadamente a varias áreas, documentar explícitamente el caso y contar cada área **una sola vez**. Evitar asignaciones vagas como `Python → todo el sistema`.

## Pendientes menores para ratificar en reunión

- Lista definitiva de equivalencias válidas entre habilidades profesionales Epic 2 y áreas técnicas de Mentorías; dueño de mantenimiento.
- Texto concreto de mensaje de `unmapped_skills`, distinto del perfil sin habilidades.
- Semántica exacta del estado visual `Mayor afinidad` cuando todas las coincidencias son cero.
- Pruebas: 2–1–0, dos skills hacia una sola área, skills custom sin correspondencia, áreas duplicadas, sin habilidades, sin mapeables, filtro Backend y página 2, empates y resultado de cero coincidencias.

**Estas son decisiones de HU9, no una modificación del modelo de habilidades de Epic 2.**
