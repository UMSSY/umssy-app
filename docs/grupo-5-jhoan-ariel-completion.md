# Postulación, feed y cálculo de afinidad

Tareas: #1257, #1258, #1278, #1279, #1249 y #1261. Las dos últimas continúan las tareas anteriores #236 y #275 de ranking y fórmula ponderada.

Entrega por PR:

- HU-02B, postulación (#1257, #1258): #1370.
- HU-06, feed por afinidad y endpoints de recomendación (#1278, #1279): PR de la rama `feature/grupo-5-hu06-feed-afinidad-v2`.
- Fórmula ponderada (#1261): los pesos configurables se integraron en #1351; #1364 añade la protección ante pesos finitos muy grandes, las variables en `.env.example` y este documento.

## Uso e integración

- La pantalla `/vacancies/recommended` tiene un acceso en Oportunidades, búsqueda por cargo, empresa o habilidad, modalidad, alta afinidad y limpieza. Filtrar conserva el orden del servidor. Alta afinidad usa el umbral propuesto de 70%; su aprobación funcional corresponde al PO.
- El detalle `/vacancies/recommended/[id]` usa el mismo cálculo que el feed y permite enviar una postulación. El catálogo general `/vacancies` conserva su pantalla y sus rutas.
- `GET /job-offers/recommendations` y `GET /job-offers/:id/match` usan el usuario autenticado y únicamente ofertas publicadas y vigentes. Un perfil sin habilidades recibe un feed vacío con `isProfileComplete: false`.
- `POST /job-offers/:id/applications` registra el estado «En revisión». La restricción única `(job_offer_id, user_id)` impide duplicados incluso con peticiones concurrentes. `GET /job-offers/:id/applications/me` recupera el estado después de recargar. El cliente muestra vacante, empresa, fecha y estado en la confirmación.
- Aplicar las migraciones del backend con `prisma migrate deploy --config prisma7.config.ts` y generar el cliente. La migración de postulaciones incluye su catálogo inicial. No ejecutar reset ni reemplazar datos existentes.

## Fórmula y ordenamiento

Cada categoría aporta `peso * requisitos cumplidos / requisitos solicitados`. El porcentaje es `100 * suma de aportes / suma de pesos participantes`, redondeado al entero más cercano y limitado a 0–100. Se omiten categorías sin requisitos. Si no hay requisitos ponderados, el resultado es 100.

Los pesos predeterminados son habilidades 60, formación 25, experiencia 10 y otros 5. Se pueden cambiar sin editar código mediante `MATCH_SCORE_WEIGHT_SKILLS`, `MATCH_SCORE_WEIGHT_ACADEMIC`, `MATCH_SCORE_WEIGHT_EXPERIENCE` y `MATCH_SCORE_WEIGHT_OTHER`, o mediante el parámetro de `WeightedScoreService.calculate`. Se aceptan valores finitos no negativos. El servicio valida la configuración al crearse; reiniciar el backend al cambiar variables. Los valores predeterminados son una propuesta técnica, no sustituyen la aprobación del PO.

`VacancyRankingService` ordena por porcentaje descendente; después carrera, experiencia y cantidad de habilidades coincidentes. Mantiene el orden original ante empate completo y no modifica la entrada.

## Contrato actual de Epic 4

Las ofertas persistidas actualmente exponen habilidades explícitas del catálogo, pero no carreras requeridas, años mínimos ni documentos solicitados. El feed y el detalle comparan esas habilidades con `userSkills` y no infieren condiciones académicas o laborales a partir de `category` ni de texto libre. Por ausencia de esas restricciones, carrera y experiencia no discriminan en el feed actual; el desempate por número de habilidades sí participa.

El algoritmo y `buildScoreRequirements` admiten las cuatro categorías. Incorporar campos estructurados de carrera, experiencia y documentos al contrato de Epic 4 (#1254) y conectarlos a las recomendaciones es trabajo de integración pendiente de ese contrato. No se debe presentar la ausencia de requisitos en el contrato como una comprobación de documentos o estudios del usuario.

## Validación

Las suites cubren postulación válida, duplicado secuencial y simultáneo, oferta no disponible, recuperación de la postulación, confirmación visual, filtros combinados, limpieza, orden estable, jerarquía de desempate, configuración de pesos y consistencia entre feed y detalle. Estas pruebas no sustituyen la validación funcional del PO ni la comprobación del despliegue.
