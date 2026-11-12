# HU-MEN-13 — Detección de información incompleta del mentor

Issue backend: https://github.com/UMSSY/umssy-app/issues/2072

Historia completa y criterios: https://github.com/UMSSY/umssy-app/issues/2070

## Objetivo y alcance

Identificar apartados profesionales pendientes de un mentor activo y generar
recomendaciones específicas, independientes y opcionales. El servicio no obliga
a completar campos ni interviene en las funciones de mentoría.

No se modifican Prisma, migraciones, frontend, controladores, endpoints ni reglas
de cupos, solicitudes, ofertas o participación. Las recomendaciones no se guardan.

## Fuentes existentes y reglas

El mentor es un `User` con un `UserRole` asociado al rol `mentor`.
`MentorsRepository.findActiveMentorById(userId, now)` proporciona el registro.

| Apartado                | Representación real                         | Se considera incompleto cuando                 |
| ----------------------- | ------------------------------------------- | ---------------------------------------------- |
| Fotografía              | `User.photoUrl: Bytes?`, binario, no URL    | Es `null` o tiene longitud cero                |
| Descripción profesional | `User.aboutMe: String?`                     | Es `null`, vacío o solo espacios tras `trim()` |
| Especialidad            | `User.mentorTechnicalAreas → TechnicalArea` | No hay áreas técnicas asociadas                |
| Experiencia laboral     | `User.workExperiences → WorkExperience`     | No hay registros laborales                     |

`headline` es el titular profesional y no sustituye las áreas técnicas.
No se exige descripción laboral opcional ni fecha final para empleos actuales.
La fotografía se evalúa por presencia de bytes; no se revalida el formato de imagen.
La normalización de descripción solo ocurre en memoria, sin actualizar el perfil.

## Participación activa

La consulta existente requiere `User.isActive = true` y un rol `mentor` con
`deletedAt = null` y `startAt <= now`. El evaluador reutiliza estos filtros sin
modificarlos. `isAvailableForMentoring = false` no excluye a un mentor activo.
Una solicitud pendiente o una oferta no sustituye el rol activo.

Si la consulta no encuentra un mentor activo (incluido un usuario inexistente),
el servicio devuelve `[]`. Los errores de lectura se propagan: no se transforman
en un resultado vacío que pueda confundirse con un perfil completo.

## Contrato del servicio

`MentorProfileSuggestionsService.findSuggestions(userId)` devuelve
`Promise<MentorProfileSuggestion[]>`. Está registrado y exportado en
`MentorsModule` y depende únicamente de `MentorsRepository`.

Cada elemento contiene `code`, `field` y `message`. El contrato discriminado de
TypeScript vincula cada código a su campo correspondiente.

| Orden | Código estable                     | Campo                  | Mensaje                                            |
| ----- | ---------------------------------- | ---------------------- | -------------------------------------------------- |
| 1     | `MISSING_PROFILE_PHOTO`            | `photoUrl`             | Agrega una fotografía a tu perfil.                 |
| 2     | `MISSING_PROFESSIONAL_DESCRIPTION` | `aboutMe`              | Completa tu descripción profesional.               |
| 3     | `MISSING_SPECIALTY`                | `mentorTechnicalAreas` | Agrega al menos un área técnica como especialidad. |
| 4     | `MISSING_WORK_EXPERIENCE`          | `workExperiences`      | Registra tu experiencia laboral.                   |

Solo se añaden los elementos correspondientes a apartados incompletos, una vez
por apartado y en el orden indicado. Un perfil completo devuelve `[]`.

Ejemplo: mentor con fotografía y especialidad, pero sin descripción ni experiencia:

```json
[
  {
    "code": "MISSING_PROFESSIONAL_DESCRIPTION",
    "field": "aboutMe",
    "message": "Completa tu descripción profesional."
  },
  {
    "code": "MISSING_WORK_EXPERIENCE",
    "field": "workExperiences",
    "message": "Registra tu experiencia laboral."
  }
]
```

Un perfil totalmente incompleto devuelve los cuatro elementos de la tabla.
No se incluyen campos sensibles, fotografías binarias ni datos laborales en la respuesta.

## Actualización y solo lectura

Cada llamada vuelve a consultar el perfil; no hay caché ni persistencia de
sugerencias. Después de guardar un apartado con los servicios existentes, una
nueva evaluación deja de devolver su recomendación y conserva las restantes.
El servicio no guarda el apartado por sí mismo ni ejecuta invalidaciones de UI.

`ProfileService`, `ProfilePhotoService` y `WorkExperienceService` conservan sus
responsabilidades de edición. El evaluador no llama operaciones de escritura,
transacciones, procesos de cupos ni reconciliación de ofertas. Construye un array
nuevo y nuevos objetos de sugerencia en cada llamada.

## Matriz de cobertura y criterios de aceptación

Archivos relativos a `backend/src/modules/mentors/tests/`:

| Escenario                                                                  | Archivo                                        | Criterios          |
| -------------------------------------------------------------------------- | ---------------------------------------------- | ------------------ |
| Normalización y valores vacíos                                             | `mentor-profile-completeness.spec.ts`          | CA2                |
| Fotografía nula, vacía y presente                                          | `mentor-profile-photo-rule.spec.ts`            | CA2                |
| Descripción nula, vacía, espacios y válida                                 | `mentor-profile-description-rule.spec.ts`      | CA2                |
| Áreas técnicas sin sustitución por titular                                 | `mentor-profile-specialty-rule.spec.ts`        | CA2                |
| Experiencia ausente/presente y opcionales                                  | `mentor-profile-work-experience-rule.spec.ts`  | CA2, CA6           |
| Perfil completo/vacío, actividad, disponibilidad, orden, mensajes, errores | `mentor-profile-suggestions.service.spec.ts`   | CA1, CA2, CA5, CA6 |
| Las 16 combinaciones, códigos/campos, orden y unicidad                     | `mentor-profile-combinations.spec.ts`          | CA2, CA5           |
| Completar cada apartado y volver a consultar                               | `mentor-profile-suggestions-updates.spec.ts`   | CA4 (backend), CA5 |
| Datos anidados intactos y solo `user.findFirst` con Prisma simulado        | `mentor-profile-suggestions-read-only.spec.ts` | CA6                |
| Providers, exports, imports y controladores existentes                     | `mentor-profile-suggestions.module.spec.ts`    | Integración        |

| Criterio de HU-13                         | Aporte de #2072                                                    | Pendiente fuera de este issue                              |
| ----------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| CA1: revisar al entrar a Mi participación | Consulta restringida a mentor activo                               | Invocación autenticada y presentación en la pantalla       |
| CA2: recomendaciones específicas          | Detección de los cuatro apartados y contrato estable               | Presentación visual                                        |
| CA3: dirigir a edición                    | Códigos y campos identifican el apartado                           | Navegación y acciones en frontend                          |
| CA4: desaparecer tras actualizar          | Nueva evaluación refleja el perfil actualizado                     | Refresco de datos al regresar a Mi participación           |
| CA5: no recomendar apartados completos    | `[]` si está completo; únicamente pendientes en perfiles parciales | Renderizado de ausencia de recomendaciones                 |
| CA6: permitir continuar sin completar     | Evaluación opcional y de solo lectura, sin nuevas validaciones     | Interfaz que mantenga las acciones de mentoría disponibles |

CA1, CA3, CA4 y CA6 incluyen comportamiento de interfaz que no queda certificado
por pruebas unitarias backend. Las pruebas de persistencia usan mocks de Prisma;
no sustituyen una prueba contra PostgreSQL real. La prueba de módulo verifica
metadatos de configuración; no inicia la aplicación completa.

## Validación y siguiente issue

Las comprobaciones incluyen la suite de mentorías, los tests específicos
`mentor-profile*.spec.ts`, ESLint y oxlint del módulo, Prettier de archivos HU-13,
TypeScript de producción, `pnpm run build` y `git diff --check`.

El siguiente issue podrá importar `MentorsModule` e inyectar
`MentorProfileSuggestionsService`. Requiere definir autenticación/autorización,
identidad del usuario, transporte HTTP y pruebas del endpoint. El frontend deberá
resolver navegación a edición y refresco de sugerencias; no están implementados
ni se define aquí una ruta HTTP. No se necesita migración ni un catálogo nuevo.

La consulta reutilizada recupera el perfil completo, incluida la fotografía
binaria. Se conserva por compatibilidad; una optimización futura requeriría
medición y pruebas sin cambiar las reglas de participación.

## Resultado de validación del cierre (2026-11-11)

- Suite completa de mentorías: 281 pruebas aprobadas en 28 archivos.
- Suite específica HU-13: 79 pruebas aprobadas en 10 archivos (incluidas en las 281).
- ESLint del módulo: aprobado.
- Oxlint del módulo: sin errores; dos advertencias preexistentes en
  `mentor-participation.spec.ts` (parámetro sin uso) y `mentors.controller.spec.ts`
  (método sin enlazar). Ninguno de esos archivos se modificó en este issue.
- Prettier de los archivos HU-13 y TypeScript de producción: aprobados.
- `pnpm run build` abortó con `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`
  durante una reinstalación automática intentada por el gestor, antes de compilar.
  Los pasos exactos del script se ejecutaron directamente y aprobaron:
  `./node_modules/.bin/tsc.cmd -p tsconfig.build.json` y
  `node scripts/copy-mail-templates.ts`. No se reinstalaron dependencias.
- `git diff --check`: sin errores.

Los commits del bloque 4 usan una excepción temporal `core.hooksPath` por comando
para evitar que lint-staged genere respaldos de stash. Se ejecutaron directamente
ESLint, oxlint y el validador de mensajes. No se cambió la configuración permanente
de hooks ni se aplicaron o modificaron stashes.

## API propuesta — Issue #2130, Bloque 1

Estado: contratos y metadatos definidos; el endpoint HTTP todavía no existe.

### Transporte y responsabilidades

Se propone `GET /api/mentors/me/profile-suggestions` con autenticación
`Authorization: Bearer <token>`. Se reutilizarán `JwtAuthGuard`, `SessionService`
y `CurrentUser`; la identidad procederá exclusivamente de `user.id`. No se
aceptará un ID alternativo de mentor por ruta, query o body.

El controlador delegará en `MentorsService`, que reutilizará
`MentorProfileSuggestionsService.findSuggestions(user.id)` y `MentorMapper`.
Las consultas seguirán en el repositorio existente. Este bloque no implementa
esos métodos ni altera consultas, reglas o participación de #2072.

### Contrato de respuesta

`MentorProfileSuggestionsResponse` representa únicamente `data`. Cada elemento
reutiliza `MentorProfileSuggestion` (`code`, `field`, `message`) y añade `title`,
`benefitDescription` y `editReference`. Los tipos vinculan código, campo y sección.
El mapper calculará `pendingCount` como la longitud del array final devuelto.
El interceptor global generará el envoltorio; no se duplicará manualmente.
Actualmente esta ruta contiene `/profile`, por lo que el interceptor usa `OK`.

Ejemplo propuesto para un perfil parcial:

```json
{
  "statusCode": 200,
  "ok": true,
  "detail": "OK",
  "data": {
    "suggestions": [
      {
        "code": "MISSING_SPECIALTY",
        "field": "mentorTechnicalAreas",
        "message": "Agrega al menos un área técnica como especialidad.",
        "title": "Completa tus áreas técnicas",
        "benefitDescription": "Ayuda a los estudiantes a identificar tus especialidades.",
        "editReference": { "section": "mentorTechnicalAreas", "action": "edit" }
      }
    ],
    "pendingCount": 1
  }
}
```

Un perfil completo devolverá el mismo envoltorio con
`data: { "suggestions": [], "pendingCount": 0 }`. Un perfil totalmente incompleto
incluirá las cuatro recomendaciones existentes en orden estable y contador 4.
Los errores de lectura se propagarán al `DomainExceptionFilter`, nunca se
convertirán en lista vacía. La autenticación conservará las excepciones existentes
del guard y de sesión. La respuesta no incluirá datos privados ni binarios.

### Metadatos de presentación

La fuente será `MENTOR_PROFILE_SUGGESTION_PRESENTATION`.

| Código                             | Título                              | Beneficio                                                              | Sección                |
| ---------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- | ---------------------- |
| `MISSING_PROFILE_PHOTO`            | Agrega tu fotografía                | Ayuda a los estudiantes a reconocerte y conocer tu perfil.             | `photoUrl`             |
| `MISSING_PROFESSIONAL_DESCRIPTION` | Completa tu descripción profesional | Presenta tu trayectoria y lo que puedes aportar como mentor.           | `aboutMe`              |
| `MISSING_SPECIALTY`                | Completa tus áreas técnicas         | Ayuda a los estudiantes a identificar tus especialidades.              | `mentorTechnicalAreas` |
| `MISSING_WORK_EXPERIENCE`          | Registra tu experiencia laboral     | Muestra la experiencia práctica que puedes compartir en las mentorías. | `workExperiences`      |

Todas las referencias tienen `action: "edit"`; identifican apartados, no rutas
de frontend. No se añade recomendación por orientaciones vacías. CA8 y CA15
mantienen áreas técnicas independientes de los tipos de orientación registrados.

### Actualización, frontend y CA12

Cada nueva consulta evaluará datos guardados actuales, con el mismo token válido,
sin caché ni persistencia de recomendaciones. Descartar cambios sin guardarlos
no alterará el resultado. CA7 y CA11 exigen contador igual a pendientes devueltos.
CA9 mantiene las recomendaciones opcionales, sin bloquear funciones de mentoría.

El frontend deberá invocar y refrescar la consulta, mostrar contador y contenido,
resolver referencias a navegación real y permitir continuar sin completar el
perfil. Este bloque no implementa interfaz ni certifica las partes visuales de
CA1, CA3, CA4, CA9 y CA10.

CA12 sigue pendiente de definición. Actualmente un mentor con rol activo recibe
sugerencias aunque `isAvailableForMentoring` sea `false`; sin rol activo recibe
`[]`. El guard rechaza usuarios inactivos. No se equipara indisponibilidad con
participación desactivada ni se crea un estado `PAUSED`. Se propone conservar
este comportamiento hasta definir el criterio, sin modificar ningún estado.

### Estándares y límites de validación

No estuvieron disponibles `especificacion GENERAL proyecto IS.pdf` ni
`PR-REVIEW-PROMPT-TEMP.md`; la revisión contra esos documentos queda pendiente.
Se verificaron las convenciones locales: carpetas `responses` y `constants`,
archivos kebab-case, tipos PascalCase, variables camelCase o UPPER_CASE, imports
ESM y responsabilidades existentes de servicios, repositorios y mappers. No se
modifican frontend, Prisma, migraciones, CI/CD ni DevOps.

Vitest configura un mínimo global del 80% en líneas, funciones, sentencias y ramas.
La cobertura debe medirse, no deducirse del número de pruebas. Este bloque añade
contratos estáticos y metadatos tipados; las pruebas HTTP y del mapper se reservan
para su implementación posterior. La consulta existente recupera binarios del
perfil; su optimización permanece pendiente sin duplicar consultas de dominios
ni cambiar las reglas de evaluación.
