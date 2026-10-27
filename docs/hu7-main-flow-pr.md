# Descripción de la corrección final de HU7

**Título:** fix(mentors): complete HU7 flow and address integration review

**Origen:** `feature/grupo-6-hu-7-correcciones-final`
**Destino:** `epic/grupo-6-red-mentorias`

## Problema y resultado

Completa HU7 para que la incorporación directa y la lista de espera compartan validaciones, idempotencia y sanciones. Una respuesta de red perdida se reintenta con el mismo UUID sin duplicar solicitudes ni contar otra intención. Se conservan el límite del 40 %, FIFO, las reservas de 24 horas y la salida definitiva con preferencias guardadas por HU6.

También atiende las observaciones aplicables a HU7 de [zer4c en la integración de Epic 6](https://github.com/UMSSY/umssy-app/pull/1712#pullrequestreview-5665806535).

## Cambios

- Servicios coordinan admisión, elegibilidad, intentos, sanciones, ofertas y salida. Los controllers invocan servicios y los repositories mantienen consultas y escrituras atómicas.
- Alta directa y confirmación reutilizan la asignación de rol, preferencias y disponibilidad.
- Ventana móvil de 24 horas, sanción exacta de 72 horas al quinto intento distinto, replay persistente y respuesta 429 con metadatos y Retry-After.
- Correo transaccional con outbox y proveedor MailService existente. Se conservan la exclusión entre workers, Message-ID estable y conciliación de resultados SMTP ambiguos.
- Vinculación de cuenta aprobada mediante OTP, sin reemplazar la contraseña de una cuenta existente. Persistencia extraída a su repository de Epic 1.
- Catálogos UUID para solicitudes, ofertas, estados de correo, operaciones y tipos de evento; auditoría e índices completos y enums TypeScript del módulo.
- Contratos y props en types/. Hooks separados para historial, edición y cancelación; cuatro diálogos, errores compartidos, Label de shadcn e imports públicos.
- Wrapper compartido con IndexedDB nativo; intenciones por usuario/operación y actualización atómica. Recuperación del UUID anterior sin perder reintentos pendientes.
- RoleGate genérico con fallback configurado por ruta. Estados visibles en español y documentación de salida alineada con HU6.
- Lectura UTC del historial para que conserve la misma fecha que la solicitud incluso con conexiones PostgreSQL en hora de Bolivia.

## Validación previa de PR1713

- Suite completa backend: 1.946 casos ejecutados aprobados.
- Regresión final de HU7 y activación aprobada: 278 casos aprobados con PostgreSQL y SMTP locales, incluidos 65 casos de integración.
- Suite completa frontend: 3.140 aprobados y tres timeouts en disponibilidad/educación. Los tres archivos se repitieron aisladamente y pasaron sus 63 casos. Regresión final de los flujos modificados: 36 aprobados.
- TypeScript, builds backend/Next.js de producción, ESLint y comprobación de diff: aprobados. Oxlint sin errores; advertencias previas documentadas.
- Todas las migraciones aplicadas sobre una base vacía y prisma migrate diff --exit-code: sin diferencias.
- Conversión de datos anteriores comprobada con FKs y unicidad. Base local respaldada; sus cinco solicitudes y dos ofertas se conservaron.
- Navegador: solicitud pendiente, historial con la misma fecha BOT, preferencias precargadas y confirmación de cancelación, manteniendo la solicitud existente.

## Validación de esta rama

- Regresión dirigida de HU7 y participación: 24 pruebas aprobadas.
- TypeScript de frontend, ESLint de los archivos modificados y builds de producción de frontend y backend: aprobados.
- El filtro local de CI Files no detecta archivos protegidos; `frontend/package.json` y `frontend/pnpm-lock.yaml` coinciden con Epic 6.
- La suite completa de frontend registró ocho timeouts en tres archivos de educación y disponibilidad mientras corría junto al build de backend. Se interrumpió esa ejecución; los tres archivos pasaron aisladamente sus 63 pruebas sin paralelismo.

Evidencia y limitaciones: [informe de HU7](https://github.com/UMSSY/umssy-app/blob/dba82a388609348f4c47c32a340409fbfc899365/docs/hu7-main-flow-correction.md), secciones G y H.

## Migración y revisiones requeridas

Aplicar las migraciones de HU7 antes de arrancar el backend nuevo. La nueva `20261027180000_mentor_participation_catalogs` convierte los estados dentro de una transacción y conserva IDs, preferencias, fechas, historial, intentos, sanciones y correo. Mantener el procedimiento Recreate: las instancias anteriores usan las columnas de texto sustituidas. Las migraciones previas permanecen intactas.

**Database:** revisar esquema, catálogos, backfill, índices y auditoría.

**DevOps:** la persistencia utiliza IndexedDB nativo. No se modifican `frontend/package.json`, su lockfile, workflows ni scripts protegidos por CI Files.

La recepción en correo institucional desplegado sigue requiriendo verificación externa de SMTP/remitente. La recepción local no certifica ese tramo.

Relacionado con #1386, #1395, #1407, #1409, #1410, #1411 y #1436–#1440. Incluye únicamente implementación, catálogos de negocio, pruebas automatizadas y documentación; sin cuentas sembradas de demostración, archivos de entorno, bases locales ni logs.
