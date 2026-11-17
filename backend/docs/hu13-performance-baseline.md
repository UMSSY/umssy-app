# HU13.1 — Línea base de Mis inscripciones

Medición local realizada el 16/11/2026 (America/La_Paz), sobre `3d3182ede2d4ee76eb616732c8fdd401c37736af`.
No se modifican el endpoint, las consultas ni la interfaz.

## Datos reproducibles

La prueba `test/registrations-performance.e2e-spec.ts` crea un usuario y 60 talleres publicados con una inscripción por taller:

| Grupo | Cantidad | Sufijos de ID | Fecha del taller |
| --- | ---: | --- | --- |
| Vigentes | 5 | 000000000001–000000000005 | Enero de 2099 |
| Finalizados por fecha | 50 | 000000000006–000000000055 | Desde enero de 2020 |
| Cancelados | 5 | 000000000056–000000000060 | Desde febrero de 2020 |

Todos los IDs de inscripción comparten el prefijo `13000000-0000-4000-8000-`; el usuario termina en `000000000000`. Los IDs de los talleres usan los mismos sufijos más 100. Los tokens QR son aleatorios y no forman parte de la respuesta medida.

En la línea base inicial, el listado devolvía los 50 finalizados seguidos de los 5 vigentes, por fecha ascendente; esta tarea registra ese comportamiento sin corregirlo. El historial devuelve los finalizados en orden inverso, 10 por página, total 50. Las cancelaciones no aparecen en ninguno. La prueba valida los IDs exactos de cada respuesta medida y el total del historial. En HU13.2 se evaluará reducir la carga de la consulta manteniendo los contratos que correspondan.

## Procedimiento y resultados

PostgreSQL 18.6 en Docker local, Node v22.23.3, Vitest, Nest HTTP mediante Supertest, controlador/servicios/repositorios y PostgreSQL reales. Una petición a la vez, sin compresión, 3 calentamientos y 20 muestras por consulta. El guard de sesión se sustituye por un usuario controlado: la medición **excluye** validación JWT, consulta de sesión, proxy, red externa y carga concurrente. No representa latencia de Staging.

| Consulta | p50 (ms) | p95 (ms) | Bytes JSON | Inscripciones recuperadas/petición |
| --- | ---: | ---: | ---: | ---: |
| `/api/event-registrations/me` | 3.990 | 5.568 | 18758 | 55 |
| `/api/event-registrations/me?scope=finished&page=1&limit=10` | 4.739 | 5.407 | 3534 | 10 |

Se cuentan las filas devueltas por `eventRegistration.findMany` mediante una extensión de Prisma: una llamada por petición en ambos casos. El historial ejecuta además su `count` existente. No se mide el total de filas examinadas por PostgreSQL ni las consultas internas de las relaciones. Los bytes corresponden al cuerpo JSON, sin cabeceras HTTP.

Muestras ordenadas en milisegundos (redondeadas a 3 decimales):

- Listado: 3.428, 3.590, 3.594, 3.608, 3.690, 3.725, 3.801, 3.806, 3.840, 3.990, 4.017, 4.078, 4.455, 4.686, 4.700, 4.954, 5.166, 5.347, 5.568, 6.178.
- Historial: 4.335, 4.410, 4.530, 4.565, 4.565, 4.587, 4.605, 4.635, 4.699, 4.739, 4.740, 4.788, 4.833, 4.899, 4.918, 4.959, 5.052, 5.228, 5.407, 7.148.

## Repetir la medición

Desde `backend`, con `DB_USER`, `DB_PASSWORD`, `DB_HOST` y `DB_PORT` de PostgreSQL local exportados. Requiere permiso para crear bases. Utilizar una base nueva y vacía en cada ejecución; el prefijo `umssy_hu13_` es obligatorio.

```bash
export DB_NAME=umssy_hu13_baseline DB_SCHEMA=public
PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
pnpm exec prisma migrate deploy --config prisma7.config.ts
HU13_BASELINE=1 HU13_REPORT_PATH=/tmp/hu13-baseline.json pnpm exec vitest run --config vitest.config.e2e.ts test/registrations-performance.e2e-spec.ts
PGPASSWORD="$DB_PASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
```

Eliminar únicamente la base temporal creada para esta prueba, también si la ejecución falla. No se ejecutan seeds generales. La prueba rechaza bases sin el prefijo requerido o que ya tengan usuarios y no borra datos. Sin `HU13_BASELINE=1`, queda omitida.

Para comparar antes/después, repetir en una base nueva con las mismas migraciones, datos, equipo, versiones y número de muestras. Conservar el JSON de cada ejecución. La prueba fija los IDs y el comportamiento actual: si HU13.2 cambia deliberadamente el conjunto devuelto, documentar la diferencia y ajustar únicamente esa expectativa. No usar umbrales de tiempo como condición de CI.

## HU13.2 — Comparación de la consulta optimizada

Se repitió la línea base y luego la versión optimizada de forma consecutiva, sin ejecutar otras pruebas en paralelo. Mismas versiones, migraciones, equipo, conjunto de 60 inscripciones y 3 calentamientos más 20 muestras; una base temporal nueva por versión. La prueba falló primero porque esperaba 5 IDs y recibió 55, y pasó tras aplicar el filtro.

EventsService construye el criterio de evento publicado y vigente usando su umbral horario de Bolivia. El repositorio de inscripciones aplica ese filtro antes de recuperar detalles. Se conserva el array y sus campos, el orden por fecha y el filtro por usuario; únicamente se excluyen talleres finalizados del listado activo. No se añaden paginación ni consultas en dos fases.

| Consulta | Versión | p50 (ms) | p95 (ms) | Bytes JSON | Filas recuperadas |
| --- | --- | ---: | ---: | ---: | ---: |
| Listado | Antes | 3.993 | 5.745 | 18758 | 55 |
| Listado | Después | 3.082 | 4.808 | 1762 | 5 |
| Historial | Antes | 4.698 | 5.583 | 3534 | 10 |
| Historial | Después | 5.350 | 6.657 | 3534 | 10 |

El listado reduce las filas recuperadas un 90,9 % (55 → 5) y el cuerpo JSON un 90,6 % (18.758 → 1.762 bytes), manteniendo una llamada findMany por petición. Se conserva la optimización por esa reducción y la mejora local de latencia observada. El historial no se modifica: mantiene 50 resultados, 10 por página y 3.534 bytes. Sus tiempos variaron entre ejecuciones; no se afirma una mejora de rendimiento del historial ni una garantía de latencia en producción.

La prueba optativa ahora espera exactamente los 5 IDs vigentes. Además comprueba las cinco páginas completas del historial, la conservación de un taller en curso hasta un segundo antes de finalizar y su exclusión exactamente a la hora de fin (con incorporación al historial). Una prueba de dominio cubre el cambio de día entre UTC y Bolivia. El contador sigue midiendo filas materializadas, no filas examinadas por el motor SQL. Las bases temporales de ambas ejecuciones se eliminaron.
