# HU-MEN-13 — Sugerencias de perfil del mentor

## Alcance y dependencia

Issue #2130: API autenticada de recomendaciones. Reutiliza los 13 commits de
#2072 y sus cuatro reglas de detección sin modificarlas. La implementación
está en `feature/grupo-6-hu13-suggestions-api`. No cambia frontend, esquema
Prisma, migraciones, CI/CD, cupos, ofertas, solicitudes ni participación.

## Arquitectura implementada

`MentorsController.findMyProfileSuggestions` recibe la identidad mediante
`CurrentUser`, después de `JwtAuthGuard`. Delega a
`MentorsService.findMyProfileSuggestions(user.id)`, que coordina
`MentorProfileSuggestionsService.findSuggestions` y
`MentorMapper.toProfileSuggestionsResponse`. El evaluador reutiliza
`MentorsRepository.findActiveMentorById`; solo el repositorio accede a Prisma.
El mapper añade metadatos y calcula el contador. El interceptor global
`ResponseInterceptor` genera el envoltorio; `DomainExceptionFilter` maneja errores.

No hay consultas nuevas, lógica de detección duplicada, caché ni persistencia
de recomendaciones. Los imports y providers existentes de `MentorsModule`
resuelven la nueva dependencia de `MentorsService`. El mapper solo utiliza el
tipo del repositorio para los métodos preexistentes; no inyecta Prisma.

## Endpoint, identidad y contrato

```http
GET /api/mentors/me/profile-suggestions
Authorization: Bearer <token>
```

El guard verifica firma y expiración del JWT y `SessionService` vuelve a cargar
al usuario. La consulta usa únicamente `user.id`; ruta, query y body no permiten
elegir otro mentor. Se mantienen las excepciones compartidas y los permisos de
las rutas existentes. Una sesión válida sin participación activa recibe cero
pendientes; una cuenta inactiva recibe 403. Sin sesión válida se responde 401.
Una sesión sin ningún rol válido también se rechaza según la protección existente.

Ejemplo de perfil parcial:

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

Para un perfil completo, `data` es `{ "suggestions": [], "pendingCount": 0 }`.
Para uno totalmente incompleto hay cuatro recomendaciones. El contador es
exactamente la longitud del array final. El contrato de `responses/` solo
representa `data`; no duplica el envoltorio. El `detail` de éxito es `OK` porque
el interceptor existente reconoce `/profile` dentro de la ruta.

Los errores de repositorio o sesión producen un error 500 mediante el filtro
compartido, con `ok: false`, `data: null`, `code: "INTERNAL_ERROR"` y un mensaje
público genérico. Nunca se convierten en lista vacía ni exponen detalles de datos.

## Reglas, identificadores y metadatos

El orden es estable: fotografía, descripción, especialidad y experiencia.
Solo se incluyen apartados pendientes, una vez por código.

| Código                             | Campo y sección de edición | Condición de ausencia                     | Mensaje                                            |
| ---------------------------------- | -------------------------- | ----------------------------------------- | -------------------------------------------------- |
| `MISSING_PROFILE_PHOTO`            | `photoUrl`                 | Bytes nulos o longitud cero               | Agrega una fotografía a tu perfil.                 |
| `MISSING_PROFESSIONAL_DESCRIPTION` | `aboutMe`                  | Nulo, vacío o solo espacios tras `trim()` | Completa tu descripción profesional.               |
| `MISSING_SPECIALTY`                | `mentorTechnicalAreas`     | Colección vacía                           | Agrega al menos un área técnica como especialidad. |
| `MISSING_WORK_EXPERIENCE`          | `workExperiences`          | Colección vacía                           | Registra tu experiencia laboral.                   |

| Código                             | Título                              | Beneficio                                                              |
| ---------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `MISSING_PROFILE_PHOTO`            | Agrega tu fotografía                | Ayuda a los estudiantes a reconocerte y conocer tu perfil.             |
| `MISSING_PROFESSIONAL_DESCRIPTION` | Completa tu descripción profesional | Presenta tu trayectoria y lo que puedes aportar como mentor.           |
| `MISSING_SPECIALTY`                | Completa tus áreas técnicas         | Ayuda a los estudiantes a identificar tus especialidades.              |
| `MISSING_WORK_EXPERIENCE`          | Registra tu experiencia laboral     | Muestra la experiencia práctica que puedes compartir en las mentorías. |

`MENTOR_PROFILE_SUGGESTION_PRESENTATION` es la fuente de metadatos.
`editReference.action` siempre es `edit`; las secciones son referencias semánticas,
no rutas de frontend. El contrato discriminado reutiliza códigos, campos y mensajes
de #2072 y vincula cada código con su sección. `headline` no sustituye especialidad.
No se añade una recomendación por tipos de orientación vacíos. Tener orientaciones
registradas no compensa áreas técnicas vacías (CA8 y CA15).

## Actualización y participación

Cada llamada consulta datos actuales. Después de guardar mediante los servicios
existentes de perfil, fotografía, áreas técnicas o experiencia, una nueva consulta
con el mismo JWT elimina únicamente el pendiente resuelto y actualiza el contador.
Un borrador descartado sin escritura no altera datos ni recomendaciones.
El evaluador solo lee: no bloquea funciones de mentoría ni exige completar campos.

La consulta requiere usuario activo y rol mentor con `deletedAt = null` y
`startAt <= now`. Disponibilidad desactivada (`isAvailableForMentoring = false`)
no excluye a un mentor con rol activo. Rol desactivado, eliminado o con inicio
futuro no constituye participación activa. Una solicitud pendiente u oferta no
sustituye ese rol.

**CA12 sigue pendiente de definición de negocio.** No existe una regla oficial
accesible que equipare indisponibilidad con participación pausada. No se creó
`PAUSED`, no se alteraron estados y se conserva el comportamiento anterior.

## Integración y pruebas

| Evidencia                                 | Alcance                                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Reglas de #2072                           | Nulos, vacíos, espacios, bytes, especialidad y experiencia                                                        |
| `mentor-profile-combinations.spec.ts`     | Las 16 combinaciones, orden, unicidad y contador final                                                            |
| Mapper y coordinación                     | Metadatos, referencias independientes, delegación y errores                                                       |
| `mentor-profile-suggestions.http.spec.ts` | 26 casos HTTP con guard real, JWT firmados y repositorios simulados                                               |
| Guardados                                 | Cuatro servicios de actualización reales sobre repositorios simulados con estado compartido                       |
| Descartes                                 | Cuatro borradores sin guardar; ninguna escritura y respuesta intacta                                              |
| Participación                             | Mentor activo/no disponible, rol desactivado/eliminado/futuro y cuenta inactiva                                   |
| Seguridad                                 | Dos mentores con pendientes distintos; query/body no cambian identidad; JWT inválido/vencido/sin firma válida     |
| CA15                                      | Las cuatro combinaciones de áreas y orientaciones                                                                 |
| Integración de módulo                     | Compila con TypeScript e inicia `MentorsModule` con metadata de producción en otro proceso; solo sustituye Prisma |

La prueba de integración resuelve el grafo real de imports/providers, inicia una
aplicación Nest y comprueba respuestas 401 y 200 sin sustituir el guard. El ciclo
preexistente Skills/NLP utiliza `forwardRef`; HU-13 no agrega ciclos. La prueba
compila `dist` y tarda más que una prueba unitaria. Los workers usan el modo test.

Estos resultados no certifican persistencia ni filtrado contra PostgreSQL real.
El proceso compilado de integración no aporta instrumentación V8 al proceso padre;
las demás pruebas ejercitan el código fuente para medir cobertura. Tampoco se
prueban navegación, renderizado o abandono de formularios en navegador.

## Estado de los 15 criterios

La matriz usa la descripción de criterios suministrada para este trabajo; el
texto oficial completo actualizado no estuvo disponible. No certifica aspectos
visuales ni reemplaza la aceptación del producto.

| Criterio | Estado backend y pendiente                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| CA1      | Consulta autenticada implementada; invocación al entrar a Mi participación pendiente de frontend                   |
| CA2      | Cuatro recomendaciones específicas verificadas; presentación visual pendiente                                      |
| CA3      | Referencias semánticas disponibles; navegación real pendiente de frontend                                          |
| CA4      | Refresco tras guardar verificado con mismo JWT y repositorios simulados; refresco visual pendiente                 |
| CA5      | Perfil completo devuelve lista vacía; solo se incluyen pendientes                                                  |
| CA6      | Evaluación de solo lectura sin nuevas restricciones; continuidad visual pendiente                                  |
| CA7      | Contador coincide con array final en las 16 combinaciones                                                          |
| CA8      | Apartados independientes, incluidas áreas y orientaciones                                                          |
| CA9      | Backend no bloquea mentorías por recomendaciones; interacción opcional pendiente de frontend                       |
| CA10     | Código, apartado, mensaje, título, beneficio y referencia verificados; visualización pendiente                     |
| CA11     | Guardar elimina solo el pendiente resuelto y reduce contador en pruebas con repositorios simulados                 |
| CA12     | Pendiente de decisión de negocio; se conserva disponibilidad y participación existentes                            |
| CA13     | Sin guardar no cambian datos ni respuesta; navegación de descarte pendiente de frontend                            |
| CA14     | Datos actualizados con el mismo JWT; persistencia real y refresco visual pendientes                                |
| CA15     | Áreas vacías con orientaciones registradas producen `MISSING_SPECIALTY`; sin recomendación nueva por orientaciones |

## Rendimiento: consulta compartida y alternativa

`findActiveMentorById` recupera identificación/nombres, titular, descripción,
disponibilidad, fotografía binaria, ciudad, educación, experiencia completa,
certificaciones con `documentUrl` binario, áreas técnicas y orientaciones.
HU-13 necesita solo presencia de fotografía no vacía, descripción y existencia
de áreas técnicas y experiencias, además de los filtros actuales de identidad/rol.

Una proyección específica podría usar longitud de bytes en PostgreSQL y existencia
o conteo de relaciones para evitar transferir binarios y registros detallados.
La mejora sería menor transferencia y materialización; no se midió latencia ni
volumen, por lo que no se afirma una mejora cuantitativa. `PhotoFileRepository.exists`
no es equivalente: acepta bytes de longitud cero. La consulta del directorio ya
filtra fotos nulas/vacías sin leer bytes, pero no cubre todo el perfil requerido.

Una implementación futura afectaría `mentors.repository.ts`, el tipo de evaluación,
el evaluador y sus pruebas/fixtures; podría exigir adaptar la entrada de la regla
de foto sin duplicarla. Debe conservar los filtros de actividad y la semántica de
bytes vacíos. No debe modificar la consulta compartida usada por el detalle y
`MentorMapper.toProfileResponse`, ni introducir consultas de otros dominios.
Si se usan varias lecturas, debe evaluarse su consistencia frente a escrituras
concurrentes. Se documenta esta alternativa sin introducir consultas ni cambios
arquitectónicos en #2130; el riesgo de lectura innecesaria permanece.

## Estándares verificados y limitaciones

No se encontraron `especificacion GENERAL proyecto IS.pdf` ni
`PR-REVIEW-PROMPT-TEMP.md` en el repositorio o adjuntos accesibles. Se contrastaron
las convenciones locales y `eslint.config.mjs`: kebab-case, sufijos `.response.ts`,
`.constants.ts`, `.spec.ts`, tipos/clases PascalCase, funciones camelCase, constantes
UPPER_CASE, imports ESM y textos visibles en español. No se añadieron mensajes de
depuración, infraestructura compartida o lógica ajena a HU-13. Las dos advertencias
preexistentes de Oxlint son parámetro sin uso en `mentor-participation.spec.ts` y
método sin enlazar en `mentors.controller.spec.ts`.

Los hooks se exceptúan únicamente por comando al registrar commits para evitar
respaldos de stash; sus analizadores y el validador de mensajes se ejecutan de forma
directa. No se cambia configuración permanente ni se manipulan stashes.

## Validación final y cobertura

Medición global con `vitest run --coverage` y la configuración original:
**3.680 pruebas aprobadas en 385 archivos**. Todos los umbrales globales del 80%
se cumplen, sin cambiar configuración, umbrales ni exclusiones.

| Alcance/archivo                           | Sentencias | Ramas  | Funciones | Líneas |
| ----------------------------------------- | ---------- | ------ | --------- | ------ |
| Backend global                            | 91,80%     | 84,89% | 87,64%    | 92,19% |
| `mentors.controller.ts`                   | 92,30%     | 100%   | 91,66%    | 92,30% |
| `mentors.service.ts`                      | 93,85%     | 85,48% | 84,21%    | 95,37% |
| `mentor-profile-suggestions.service.ts`   | 100%       | 91,66% | 100%      | 100%   |
| `mentors.repository.ts`                   | 98,88%     | 90,24% | 97,77%    | 98,83% |
| `mentor.mapper.ts`                        | 100%       | 100%   | 100%      | 100%   |
| `mentor-profile-completeness.ts`          | 100%       | 100%   | 100%      | 100%   |
| `mentor-profile-suggestions.constants.ts` | 100%       | 100%   | 100%      | 100%   |

Los porcentajes por archivo incluyen métodos preexistentes; no representan una
medición aislada de las líneas añadidas por #2130. Los contratos exclusivamente
de tipos no tienen lógica ejecutable que medir. No se añade un commit artificial
de ramas restantes porque el mínimo se cumple y las brechas relevantes de
integración ya fueron cubiertas.

La suite específica de HU-13 aprobó 113 pruebas en 14 archivos. El build aprobó
ejecutando los pasos existentes `tsc -p tsconfig.build.json` y
`node scripts/copy-mail-templates.ts` con las dependencias instaladas; no se
ejecutó el wrapper `pnpm run build` ni se reinstalaron paquetes. TypeScript de
producción sin emisión, ESLint, Prettier y `git diff --check` aprobaron. Oxlint
terminó sin errores y con las dos advertencias preexistentes descritas arriba.

Una ejecución de mentorías simultánea con la cobertura global y otros procesos
sufrió timeouts en la compilación de integración y el arranque HTTP. No se
ampliaron timeouts ni se cambió configuración. La repetición aislada aprobó
**317 pruebas en 32 archivos de mentorías**, incluida la integración compilada.
Los reportes detallados se generan localmente en `backend/coverage/`
y no se incluyen en commits.

El backend de #2130 está listo para revisión técnica con estas limitaciones
declaradas: CA12 sin definición, documentos oficiales no disponibles, pruebas
de PostgreSQL y frontend pendientes, y lectura compartida de binarios sin
optimizar. Esto no certifica aceptación completa de la historia ni autoriza
publicación, merge o creación de PR.
