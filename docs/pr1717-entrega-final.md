# Entrega de correcciones del PR #1717

Correcciones sobre `ea70c8955ae7b7c141dc2b9ecf71a6c2992c7cad`, preparadas inicialmente en `feature/grupo-6-hu-7-correcciones-final` y publicadas en la nueva rama `codex/grupo-6-pr1717-correcciones-finales` por solicitud del usuario.

## Correcciones implementadas

- HU6 muestra «Desactivar participación». Se conserva el endpoint de salida, la confirmación, el bloqueo de citas futuras y las preferencias.
- Props de activación de cuenta, participación, elementos guardados y diálogo de cupos separados en archivos de tipos. Contratos de resultado de activación y fallo SMTP separados.
- Eliminados los comentarios de los archivos propios intervenidos por el PR. Los catches de los diálogos se sustituyeron por callbacks de TanStack Query, conservando errores visibles y bloqueo de doble envío.
- La consulta de capacidad devuelve únicamente conteos; el cálculo del 40 % permanece en la función de dominio usada por los servicios. Se reutiliza la consulta desde el repository transaccional y la semilla local. Se retiró una consulta de elegibilidad sin consumidores.
- Eliminado el fallback en memoria de las claves de idempotencia. El envío requiere una transacción persistente exitosa; los fallos se muestran mediante la utilidad compartida.
- El wrapper conserva sus cuatro interfaces, espera el cierre de la transacción y rechaza abortos, almacenamiento ausente y aperturas bloqueadas. Las escrituras solicitan durabilidad estricta.
- Los UUID se conservan ante errores de red, 5xx y timeout HTTP 408. La limpieza de claves heredadas espera la persistencia; un fallo tras la confirmación HTTP se informa explícitamente.
- La reincorporación espera la limpieza de claves y presenta sus errores. El borrador HU3 mantiene su almacenamiento y recuperación.
- Pruebas preparadas para almacenamiento, abortos, recuperación de UUID, fallo posterior a confirmación, errores visibles y bloqueo de operaciones duplicadas.

## Observaciones de DevOps

Se conservan la cadena Controller → Service → Repository, la validación Zod de cuerpos, las excepciones y los contratos HTTP. La asignación directa y la confirmación de oferta siguen usando `assignMentorParticipation` dentro de sus transacciones.

PendingParticipation mantiene hooks y diálogos separados, TanStack Query, invalidación de solicitud e historial, Label e importación pública de catálogos. RoleGate sigue siendo genérico y admite fallback configurable.

Las reglas de elegibilidad, FIFO, ofertas de 24 horas, cinco intentos, sanción de 72 horas y outbox no se modificaron. Su validación ejecutable queda pendiente.

## Dependencias pendientes

- **DevOps:** autorizar e instalar `idb` como dependencia directa de frontend. No figura en `frontend/package.json`; no se modificaron manifiestos ni lockfiles. Sigue pendiente sustituir internamente el wrapper nativo por `idb` después de esa autorización.
- **DevOps y equipo de Availability:** acordar un contrato público de comprobación de citas que participe en la misma transacción de salida y preserve la coordinación con reservas concurrentes. `backend/src/modules/mentors/repositories/mentor-exit.repository.ts` conserva `LOCK TABLE appointments IN SHARE MODE`, la lectura de citas y el import interno de `backend/src/modules/availability/constants/appointment-status.constants.ts`. No se reemplazó por una comprobación fuera de la transacción.
- **Database:** revisar las migraciones existentes de idempotencia/outbox y catálogos. Para retirar comentarios protegidos, aprobar el cambio en `backend/prisma/schema.prisma:757`, `backend/prisma/migrations/20261027030000_mentor_intake_idempotency_outbox/migration.sql:1,61,62` y `backend/prisma/migrations/20261027180000_mentor_participation_catalogs/migration.sql:1`. Permanecen intactos. Los archivos generados de `backend/src/prisma/**` tampoco se editaron. No se detectó una nueva diferencia de nombres que requiera cambiar schema o SQL en esta corrección.

## Verificación

`git diff --check` pasó. Se verificó que no hay cambios en CI/CD, hooks, scripts de DevOps, manifiestos, lockfiles, configuraciones ni archivos protegidos de Prisma. No se encontraron comentarios en los archivos fuente modificados.

No se ejecutaron suites, lint global, builds ni migraciones. Esta carpeta no tiene `frontend/node_modules` ni `backend/node_modules`; no se instalaron dependencias. La comprobación de tipos y las pruebas deben realizarse en el entorno preparado por DevOps.

Comandos de PowerShell para revisión local, sin instalar dependencias:

```powershell
Set-Location 'C:\Users\HP\umssy-hu7-pr1717-fix'
git status --short
git diff --check
git diff --stat
git ls-files --others --exclude-standard

$frontendTests = @(
  'src/shared/services/storage/browser-indexed-db.test.ts'
  'src/shared/services/storage/business-record-storage.test.ts'
  'src/modules/mentorship/services/mentor-intake-idempotency.test.ts'
  'src/modules/mentorship/services/mentor-activation.service.test.ts'
  'src/modules/mentorship/services/mentorship-wizard-draft.service.test.ts'
  'src/modules/mentorship/hooks/use-mentorship-wizard.test.ts'
  'src/modules/mentorship/views/mentorship-view.test.tsx'
  'src/modules/mentors/services/mentor-participation.service.test.ts'
  'src/modules/mentors/views/participation-view.test.tsx'
  'src/modules/mentors/components/participation/pending-participation.test.tsx'
  'src/modules/mentors/components/participation/cancel-slot-request-dialog.test.tsx'
  'src/modules/mentors/components/participation/slot-offer-participation.test.tsx'
  'src/modules/mentors/components/participation/slot-availability-preview.test.tsx'
  'src/modules/access-request/views/activate-approved-account-view.test.tsx'
)
pnpm --dir frontend exec vitest run @frontendTests

$backendTests = @(
  'src/modules/mentors/tests/mentor-capacity.spec.ts'
  'src/modules/mentors/tests/mentor-exit.spec.ts'
  'src/modules/mentors/tests/mentor-offers.spec.ts'
  'src/modules/mentors/tests/mentor-participation.spec.ts'
  'src/modules/mentors/tests/mentor-participation-contract.spec.ts'
  'src/modules/mentors/tests/mentors.service.spec.ts'
  'src/modules/mentors/tests/mentors.repository.spec.ts'
  'src/modules/mentors/tests/mentors.controller.spec.ts'
)
pnpm --dir backend exec vitest run @backendTests
```

## Archivos modificados o añadidos

- [backend/src/modules/access-requests/services/approved-account-activation.service.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/access-requests/services/approved-account-activation.service.ts)
- [backend/src/modules/access-requests/tests/approved-account-activation.integration.spec.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/access-requests/tests/approved-account-activation.integration.spec.ts)
- [backend/src/modules/mentors/repositories/mentor-assignment.queries.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/repositories/mentor-assignment.queries.ts)
- [backend/src/modules/mentors/repositories/mentor-capacity.queries.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/repositories/mentor-capacity.queries.ts)
- [backend/src/modules/mentors/repositories/mentor-exit.repository.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/repositories/mentor-exit.repository.ts)
- [backend/src/modules/mentors/repositories/mentor-transaction.repository.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/repositories/mentor-transaction.repository.ts)
- [backend/src/modules/mentors/seeds/mentor-capacity.seed.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/seeds/mentor-capacity.seed.ts)
- [backend/src/modules/mentors/services/mentor-exit.service.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/services/mentor-exit.service.ts)
- [backend/src/modules/mentors/services/mentor-intake.service.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/services/mentor-intake.service.ts)
- [backend/src/modules/mentors/services/mentor-mail-outbox.service.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/services/mentor-mail-outbox.service.ts)
- [backend/src/modules/mentors/services/mentor-offer-allocation.service.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/services/mentor-offer-allocation.service.ts)
- [backend/src/modules/mentors/services/mentor-offers.service.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/services/mentor-offers.service.ts)
- [backend/src/modules/mentors/services/mentors.service.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/services/mentors.service.ts)
- [backend/src/modules/mentors/tests/mentor-capacity.spec.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/tests/mentor-capacity.spec.ts)
- [backend/src/modules/mentors/tests/mentor-offers.integration.spec.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/tests/mentor-offers.integration.spec.ts)
- [backend/src/modules/mentors/types/mentor-activation-result.types.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/types/mentor-activation-result.types.ts)
- [backend/src/modules/mentors/types/mentor-mail-delivery-failure.types.ts](C:/Users/HP/umssy-hu7-pr1717-fix/backend/src/modules/mentors/types/mentor-mail-delivery-failure.types.ts)
- [frontend/src/modules/access-request/types/activate-approved-account-view-props.types.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/access-request/types/activate-approved-account-view-props.types.ts)
- [frontend/src/modules/access-request/views/activate-approved-account-view.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/access-request/views/activate-approved-account-view.tsx)
- [frontend/src/modules/mentors/components/participation/deactivate-participation-modal.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/components/participation/deactivate-participation-modal.tsx)
- [frontend/src/modules/mentors/components/participation/participation-empty-state.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/components/participation/participation-empty-state.tsx)
- [frontend/src/modules/mentors/components/participation/participation-overview.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/components/participation/participation-overview.tsx)
- [frontend/src/modules/mentors/components/participation/pending-participation.test.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/components/participation/pending-participation.test.tsx)
- [frontend/src/modules/mentors/components/participation/pending-request-cancel-dialog.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/components/participation/pending-request-cancel-dialog.tsx)
- [frontend/src/modules/mentors/components/participation/pending-request-edit-dialog.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/components/participation/pending-request-edit-dialog.tsx)
- [frontend/src/modules/mentors/components/participation/slot-availability-preview.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/components/participation/slot-availability-preview.tsx)
- [frontend/src/modules/mentors/components/participation/slot-offer-participation.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/components/participation/slot-offer-participation.tsx)
- [frontend/src/modules/mentors/hooks/use-pending-participation.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/hooks/use-pending-participation.ts)
- [frontend/src/modules/mentors/services/mentor-participation.service.test.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/services/mentor-participation.service.test.ts)
- [frontend/src/modules/mentors/types/participation-empty-state-props.types.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/types/participation-empty-state-props.types.ts)
- [frontend/src/modules/mentors/types/participation-view-props.types.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/types/participation-view-props.types.ts)
- [frontend/src/modules/mentors/types/saved-participation-items-props.types.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/types/saved-participation-items-props.types.ts)
- [frontend/src/modules/mentors/types/slot-unavailable-dialog-props.types.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/types/slot-unavailable-dialog-props.types.ts)
- [frontend/src/modules/mentors/utils/participation-error.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/utils/participation-error.ts)
- [frontend/src/modules/mentors/views/participation-view.test.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/views/participation-view.test.tsx)
- [frontend/src/modules/mentors/views/participation-view.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentors/views/participation-view.tsx)
- [frontend/src/modules/mentorship/services/mentor-activation.service.test.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentorship/services/mentor-activation.service.test.ts)
- [frontend/src/modules/mentorship/services/mentor-intake-idempotency.test.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentorship/services/mentor-intake-idempotency.test.ts)
- [frontend/src/modules/mentorship/services/mentor-intake-idempotency.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentorship/services/mentor-intake-idempotency.ts)
- [frontend/src/modules/mentorship/views/mentorship-view.test.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentorship/views/mentorship-view.test.tsx)
- [frontend/src/modules/mentorship/views/mentorship-view.tsx](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/modules/mentorship/views/mentorship-view.tsx)
- [frontend/src/shared/services/storage/browser-indexed-db.test.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/shared/services/storage/browser-indexed-db.test.ts)
- [frontend/src/shared/services/storage/browser-indexed-db.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/shared/services/storage/browser-indexed-db.ts)
- [frontend/src/shared/services/storage/business-record-storage-error.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/shared/services/storage/business-record-storage-error.ts)
- [frontend/src/shared/services/storage/business-record-storage.test.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/shared/services/storage/business-record-storage.test.ts)
- [frontend/src/shared/services/storage/business-record-storage.ts](C:/Users/HP/umssy-hu7-pr1717-fix/frontend/src/shared/services/storage/business-record-storage.ts)

Esta entrega añade además [docs/pr1717-entrega-final.md](C:/Users/HP/umssy-hu7-pr1717-fix/docs/pr1717-entrega-final.md).
