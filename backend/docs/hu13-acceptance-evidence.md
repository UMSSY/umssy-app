# HU13.3 — Aceptación y evidencia local

Validación realizada el 16/11/2026 (America/La_Paz). Se acordó omitir la ejecución en Staging: este documento no acredita despliegue ni resultados en ese entorno. No se modificó código productivo.

## Evidencia por criterio

| Criterio | Prueba local | Resultado |
| --- | --- | --- |
| Solo inscripciones vigentes propias | `registrations-performance.e2e-spec.ts`: 60 inscripciones, 5 IDs activos exactos | Aprobado con PostgreSQL real |
| Historial completo, orden y páginas | Mismo E2E: 50 IDs exactos repartidos en cinco páginas | Aprobado con PostgreSQL real |
| Transición al finalizar | Mismo E2E: un segundo antes y exactamente al finalizar; `my-passes-acceptance.test.tsx`: consulta de historial y retorno a Vigentes | Aprobado |
| Pase y QR conservados | E2E: dos consultas devuelven el mismo token; `pass-qr.test.tsx`: decodificación real con jsQR; aceptación UI: selección cambia QR y detalle | Aprobado |
| Cancelaciones excluidas | E2E: cancelación HTTP, pase deja de estar disponible, listado activo sin ese ID e historial con total 50 | Aprobado con PostgreSQL real |
| Aislamiento entre usuarios | E2E: dos usuarios, userId inyectado ignorado y consulta de pase ajeno devuelve 404; `my-passes-auth.spec.ts`: validación del guard | Aprobado |
| Carga, vacío, error y reintento | Nueva aceptación UI con fallo del transporte y recuperación a listado vacío | Aprobado |
| Botón de chat | Nueva aceptación UI invoca el callback con la inscripción seleccionada | Aprobado |
| Medición en Staging | No ejecutada por alcance acordado | Omitida |

## Alcance de las pruebas

La nueva aceptación frontend usa MyPassesView, hooks, servicios, parsers y generación de QR reales. Solo sustituye el adaptador Axios para controlar respuestas, errores y paginación. Simula el cambio de respuesta tras finalizar un taller; no conecta el navegador a una API desplegada.

La aceptación backend utiliza HTTP de Nest, servicios/repositorios y PostgreSQL reales en una base temporal con las migraciones del proyecto. La sesión es controlada por un guard de prueba; no se mide ni se acredita autenticación JWT contra una base real. Tras medir las 60 inscripciones iniciales, el escenario de privacidad añade una inscripción de otro usuario y el de cancelación modifica una inscripción propia. Estos cambios no forman parte del benchmark.

Las pruebas existentes de autenticación, cancelación, historial, estados de carga, offline y QR se ejecutaron junto con las nuevas para cubrir regresiones.

## Medición local de comprobación

Mismo procedimiento de [HU13.1 y HU13.2](hu13-performance-baseline.md): PostgreSQL 18.6 local, Node v22.23.3, tres calentamientos y 20 muestras por consulta, sin otras suites en paralelo.

| Consulta | p50 (ms) | p95 (ms) | Bytes JSON | Filas materializadas/petición |
| --- | ---: | ---: | ---: | ---: |
| Vigentes | 2.923 | 4.118 | 1762 | 5 |
| Historial, página 1 | 5.000 | 5.539 | 3534 | 10 |

Se conserva la reducción de 55 a 5 filas y de 18.758 a 1.762 bytes del listado. Los tiempos son locales, excluyen JWT y red externa, y no garantizan latencia de producción. La base temporal fue eliminada.

## Repetir las comprobaciones

Desde cada carpeta correspondiente:

```bash
# frontend
pnpm exec vitest run src/modules/events src/modules/event-registrations
pnpm exec tsc --noEmit
# backend
pnpm exec vitest run src/modules/events src/modules/event-registrations
```

Para las tres pruebas con PostgreSQL, seguir el procedimiento de base temporal del documento de línea base y ejecutar `test/registrations-performance.e2e-spec.ts` con `HU13_BASELINE=1`. Esa prueba queda omitida sin activación explícita.

Resultado de esta ejecución: **594 pruebas frontend, 318 backend y 3 con PostgreSQL real aprobadas**. Lint de ambos archivos de prueba y comprobaciones de tipos frontend/archivo backend aprobados.
