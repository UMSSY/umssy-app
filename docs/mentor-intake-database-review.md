# Solicitud técnica para Database: persistencia de incorporación de mentores

Estado: **pendiente de autorización/intervención de Database**. Esta entrega no
modifica `backend/prisma/` ni consolida una migración adicional. El SQL adjunto es
una propuesta sin ejecutar, fuera del directorio de migraciones.

Referencias: estándar general, secciones 5.1–5.6; `.github/CODEOWNERS`;
commit auditado `f072d48416559d5b056216fbcabf7a0113468d8f`;
compatibilidad `20261028010000_mentor_intake_compatibility` ya publicada en la rama.

## Auditoría de los tres modelos

| Modelo                        | Correcto actualmente                                                                                                                                         | Diferencias respecto al estándar                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MentorIntakeAttempt`         | UUID de ID y FK; mapeo de campos/tabla; `occurredAt` con timestamptz(6); unicidad por usuario/operación/UUID; FK usuario Restrict; índice parcial de ventana | Falta `createdAt` y `updatedAt` en Prisma y en una base nueva. Falta índice completo de FK usuario (el parcial no cubre todos los intentos). `operation` textual. ID usa `dbgenerated`, no `uuid()`. |
| `MentorParticipationSanction` | UUID, mapeo, fechas timestamptz(6), índice usuario/fin, trigger de intento único y opcional, CHECK de 72 horas                                               | Falta auditoría Prisma y en base nueva. La FK de intento usa Restrict en base nueva y SetNull en la catalogada; el modelo declara Restrict. ID `dbgenerated`.                                        |
| `MentorMailOutbox`            | UUID, mapeo, `createdAt` y fechas timestamptz(6), evento único, destinatario limitado, FK usuario Restrict, índice de despacho                               | Falta `updatedAt`; falta índice completo de usuario. `kind` y `status` textuales. ID `dbgenerated`. El nombre del índice textual de compatibilidad difiere del map del modelo.                       |

Una base que aplicó #1717 conserva columnas de auditoría, índices y catálogos que
la base nueva de develop no tiene. La corrección vigente agrega texto sin borrar
UUID de catálogo y sincroniza escrituras en ambas direcciones mediante triggers.
**No se considera esto cumplimiento definitivo de catálogos ni esquema sin drift.**

## Decisiones requeridas

1. Incorporar auditoría mediante una **nueva** migración autorizada y actualizar
   los tres modelos, sin editar migraciones que ya se ejecutaron. El borrador
   `mentor-intake-audit-proposal.sql` usa defaults, backfill y triggers para no
   romper inserts SQL ni dejar updates sin auditoría.
2. Acordar SetNull para la FK opcional de trazabilidad; mantener Restrict en el
   usuario como excepción justificada para conservar intentos, sanciones e historial.
3. Resolver los catálogos de operación, estado y tipo de evento de forma
   coordinada. En bases históricas, reutilizar los IDs/tablas existentes. En bases
   nuevas, crear catálogos con ID, title único, description y auditoría. Agregar
   primero FK opcionales, backfill, restricciones e índices; conservar el puente
   textual mientras existan lectores/escritores de las dos versiones. Preparar
   enums TypeScript de valores; no introducir enums Prisma.
4. Alinear nombres de índices en Prisma con los índices reales, sin eliminar
   índices que todavía respaldan consultas, unicidad o compatibilidad.

### UUID: excepción temporal justificada

No se cambió a `@default(uuid())` automáticamente. Tanto Prisma como SQL crean
registros. Los repositories de incorporación, el algoritmo de ofertas, la
migración/backfill y los fixtures históricos insertan IDs generados en PostgreSQL;
algunas rutas SQL dependen de un default del servidor y otras envían el ID.
Cambiar solamente el modelo puede producir una migración que quite un default
necesario. Database debe decidir si conserva el default SQL con una excepción
documentada o coordina todos los escritores antes de cambiar el modelo.

## Pruebas de compatibilidad y de una futura migración

Los escenarios A/B actuales y su ledger se prueban localmente. La propuesta de
auditoría **no se presenta como aplicada ni probada**.

Antes de autorizarla:

1. Crear dos bases PostgreSQL locales descartables y verificar host/nombre.
2. A: ejecutar todas las migraciones actuales. B: aplicar también los dos SQL
   históricos preservados en fixtures y sus entradas `_prisma_migrations` antes
   de ejecutar la corrección. No cambiar checksums de entradas existentes.
3. Tomar snapshots por ID de solicitudes, ofertas, roles, preferencias, fechas,
   intentos, sanciones, respuestas idempotentes y eventos. Conservar fechas con
   precisión SQL y no solamente su representación JavaScript.
4. Incorporar la nueva migración autorizada y regenerar Prisma. Probar inserts y
   updates tanto Prisma como SQL crudo omitiendo la auditoría para comprobar
   defaults y triggers. Verificar índices, FK, auditoría y todos los snapshots.
5. Ejecutar `prisma migrate deploy` por segunda vez: sin pendientes. Probar ambos
   GET de participación, capacidad, intentos, sanciones y carreras H1.
6. Comprobar unicidad de intentos/eventos y no pérdida de estados al escribir con
   texto o catálogo. Acordar un despliegue con escritores antiguos detenidos.

## Riesgo y rollback

Backfill e índices pueden tomar bloqueos y requerir una ventana de mantenimiento.
No dar fechas históricas inventadas: inicializar `created_at` con el instante de
negocio ya guardado (`occurred_at`/`started_at`) y conservar auditoría existente.
Un fallo anterior a COMMIT revierte la propuesta transaccional. Después de COMMIT,
retroceder el código preservando columnas/defaults y datos adicionales; **no**
borrar columnas ni catálogos ni reescribir `_prisma_migrations`. Una reversión de
restricciones o triggers exige otra migración revisada y respaldo verificado.

No ejecutar este borrador en QA/producción. Los responsables de Database deben
aprobar el SQL definitivo, el ajuste Prisma y el plan de despliegue/recuperación.
