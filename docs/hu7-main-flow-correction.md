# HU7 — Corrección del flujo principal

## A. Resumen

Rama: `feature/grupo-6-hu7-main-flow-correction`. Base inicial: `a85e72c4`; sincronizada posteriormente con `da499bb6` de `epic/grupo-6-red-mentorias` para resolver los conflictos del [PR1713](https://github.com/UMSSY/umssy-app/pull/1713). Se incorporaron las integraciones recientes #1705 y #1711 sin fusionar el PR hacia la épica ni cerrar issues.

La base ya tenía capacidad del 40 %, solicitudes persistidas, FIFO determinístico, ofertas de 24 horas, confirmación, worker de expiración y salida definitiva. Se conservaron sus pruebas y las de disponibilidad reversible de Epic 7. Faltaban la ventana móvil compartida con HU3, idempotencia, metadatos completos de sanción, correo transaccional y una forma explícita de consumir la aprobación de Epic 1 para vincular al usuario.

Se implementaron esas piezas y se corrigió el reingreso con preferencias residuales. El frontend conserva el UUID ante fallos de red/5xx, evita envíos simultáneos y presenta una suspensión genérica. La revisión móvil detectó un encabezado que desbordaba y confundía el sidebar de escritorio con el móvil: la corrección se limita a esos controles compartidos, sin cambiar autorización, login ni reglas de otras épicas.

Referencias consultadas: [HU7 #1386](https://github.com/UMSSY/umssy-app/issues/1386), subtareas #1395, #1407, #1409, #1410, #1411, #1436–#1440 y [PR1665](https://github.com/UMSSY/umssy-app/pull/1665). [PR1478](https://github.com/UMSSY/umssy-app/pull/1478) fue cerrado sin merge; las ofertas ya estaban integradas por #1665. Se inspeccionó el código actual y se conservó esa funcionalidad.

## B. Archivos

Al sincronizar se retiró el modal antiguo de salida, sustituido por el modal integrado de HU6. Los fixtures automatizados crean esquemas PostgreSQL propios; no cargan cuentas de demostración en la aplicación. No se incluyen bases, credenciales, archivos de entorno, logs, scripts de demostración ni cambios de despliegue.

| Archivo nuevo o modificado | Motivo |
|---|---|
| `backend/prisma/schema.prisma` | Relaciones y modelos para las tres persistencias nuevas. |
| `backend/src/common/filters/domain-exception.filter.ts` | Devolver y exponer Retry-After manteniendo el contrato de respuesta. |
| `backend/src/main.ts` | Devolver y exponer Retry-After manteniendo el contrato de respuesta. |
| `backend/src/modules/access-requests/access-requests.module.ts` | Registrar dependencias de activación/correo dentro de los módulos existentes. |
| `backend/src/modules/access-requests/controllers/access-requests.controller.ts` | Exigir UUID en ambas rutas públicas y usar la identidad JWT. |
| `backend/src/modules/access-requests/mail/mail-sender.ts` | Integrar aprobación con el proveedor de correo ya existente y enlace de activación. |
| `backend/src/modules/access-requests/services/activation-otp.service.ts` | Integrar aprobación con el proveedor de correo ya existente y enlace de activación. |
| `backend/src/modules/access-requests/tests/access-requests.backoffice-guards.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/access-requests/tests/access-requests.document.controller.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/access-requests/tests/access-requests.id-validation.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/access-requests/tests/access-requests.submit.controller.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mail/services/mail.service.ts` | Message-ID estable, detección de SMTP y logs sin cuerpo ni destinatario. |
| `backend/src/modules/mail/tests/mail.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mail/types/send-mail-payload.types.ts` | Message-ID estable, detección de SMTP y logs sin cuerpo ni destinatario. |
| `backend/src/modules/mentors/controllers/mentor-participation.controller.ts` | Exigir UUID en ambas rutas públicas y usar la identidad JWT. |
| `backend/src/modules/mentors/controllers/mentors.controller.ts` | Exigir UUID en ambas rutas públicas y usar la identidad JWT. |
| `backend/src/modules/mentors/exceptions/mentor-participation.exception.ts` | Transportar metadatos de suspensión y Retry-After. |
| `backend/src/modules/mentors/mentors.module.ts` | Registrar dependencias de activación/correo dentro de los módulos existentes. |
| `backend/src/modules/mentors/repositories/mentor-offers.queries.ts` | Crear evento OFFER atómicamente con la reserva. |
| `backend/src/modules/mentors/repositories/mentor-participation.repository.ts` | Compartir transacción/política de alta; mantener elegibilidad, capacidad y FIFO. |
| `backend/src/modules/mentors/repositories/mentors.repository.ts` | Compartir transacción/política de alta; mantener elegibilidad, capacidad y FIFO. |
| `backend/src/modules/mentors/services/mentor-offers-worker.service.ts` | Despachar outbox tras reconciliar y aislar errores sin datos sensibles. |
| `backend/src/modules/mentors/services/mentor-participation.service.ts` | Compartir transacción/política de alta; mantener elegibilidad, capacidad y FIFO. |
| `backend/src/modules/mentors/services/mentors.service.ts` | Compartir transacción/política de alta; mantener elegibilidad, capacidad y FIFO. |
| `backend/src/modules/mentors/tests/mentor-capacity.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mentors/tests/mentor-offers.integration.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mentors/tests/mentor-participation-contract.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mentors/tests/mentor-participation-fifo.integration.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mentors/tests/mentor-participation.integration.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mentors/tests/mentor-participation.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mentors/tests/mentors.controller.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mentors/tests/mentors.repository.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mentors/tests/mentorship-response.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/prisma/browser.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `backend/src/prisma/client.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `backend/src/prisma/commonInputTypes.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `backend/src/prisma/internal/class.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `backend/src/prisma/internal/prismaNamespace.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `backend/src/prisma/internal/prismaNamespaceBrowser.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `backend/src/prisma/models.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `backend/src/prisma/models/User.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `frontend/src/modules/mentors/components/participation/mentor-exit-dialog.tsx` | Retirado al sincronizar: el nuevo modal de HU6 concentra la salida definitiva sin duplicar controles. |
| `frontend/src/modules/mentors/components/participation/deactivate-participation-modal.tsx` | Conserva el diseño nuevo, el botón Pausar mentoría y la confirmación explícita de pérdida de rol, cupo y prioridad. |
| `frontend/src/modules/mentors/components/participation/participation-overview.tsx` | Conserva estados activo/desactivado y preferencias de HU6 con la acción Pausar mentoría de HU7. |
| `frontend/src/modules/mentors/views/participation-view.tsx` | Compone HU6/HU7 y mantiene visible el vencimiento tanto para titulados nuevos como para exmentores. |
| `frontend/src/modules/mentors/views/participation-view.test.tsx` | Conserva los casos de HU6 y adapta las regresiones previas de carga, errores, datos reales y vencimiento. |
| `frontend/src/modules/mentors/components/participation/pending-participation.tsx` | Integrar claves UUID, mensajes de suspensión o protección síncrona de envíos. |
| `frontend/src/modules/mentors/services/mentor-participation.service.ts` | Compartir transacción/política de alta; mantener elegibilidad, capacidad y FIFO. |
| `frontend/src/modules/mentors/utils/participation-error.ts` | Integrar claves UUID, mensajes de suspensión o protección síncrona de envíos. |
| `frontend/src/modules/mentorship/services/mentor-activation.service.test.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `frontend/src/modules/mentorship/services/mentor-activation.service.ts` | Integrar claves UUID, mensajes de suspensión o protección síncrona de envíos. |
| `frontend/src/modules/mentorship/views/mentorship-view.tsx` | Integrar claves UUID, mensajes de suspensión o protección síncrona de envíos. |
| `frontend/src/shared/components/layout/account-menu.tsx` | Corregir desbordamiento y acceso al menú móvil detectados al probar HU7. |
| `frontend/src/shared/components/layout/app-header.tsx` | Corregir desbordamiento y acceso al menú móvil detectados al probar HU7. |
| `frontend/src/shared/components/layout/navigation-search.tsx` | Corregir desbordamiento y acceso al menú móvil detectados al probar HU7. |
| `frontend/src/shared/components/layout/sidebar-toggle-button.tsx` | Corregir desbordamiento y acceso al menú móvil detectados al probar HU7. |
| `backend/prisma/migrations/20261027030000_mentor_intake_idempotency_outbox/migration.sql` | Persistencia aditiva de intentos, sanciones y outbox; conserva historial previo. |
| `backend/src/modules/access-requests/exceptions/approved-account-activation.exception.ts` | Consumir OTP de aprobación y enlazar cuenta sin reemplazar el login. |
| `backend/src/modules/access-requests/mail/institutional-mail-sender.ts` | Integrar aprobación con el proveedor de correo ya existente y enlace de activación. |
| `backend/src/modules/access-requests/requests/activate-approved-account.schema.ts` | Consumir OTP de aprobación y enlazar cuenta sin reemplazar el login. |
| `backend/src/modules/access-requests/services/approved-account-activation.service.ts` | Consumir OTP de aprobación y enlazar cuenta sin reemplazar el login. |
| `backend/src/modules/access-requests/tests/approved-account-activation.integration.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/modules/mentors/repositories/mentor-intake-policy.ts` | Política única transaccional de ventana móvil, sanción e idempotencia. |
| `backend/src/modules/mentors/services/mentor-mail-outbox.service.ts` | Despacho durable, sin SMTP dentro de transacciones y sin reenvío ambiguo. |
| `backend/src/modules/mentors/tests/mentor-intake-migration.integration.spec.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `backend/src/prisma/models/MentorIntakeAttempt.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `backend/src/prisma/models/MentorMailOutbox.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `backend/src/prisma/models/MentorParticipationSanction.ts` | Cliente y tipos regenerados desde Prisma; sin edición semántica manual. |
| `frontend/src/app/(public)/activate-account/page.tsx` | Consumir OTP de aprobación y enlazar cuenta sin reemplazar el login. |
| `frontend/src/modules/access-request/views/activate-approved-account-view.test.tsx` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `frontend/src/modules/access-request/views/activate-approved-account-view.tsx` | Consumir OTP de aprobación y enlazar cuenta sin reemplazar el login. |
| `frontend/src/modules/mentorship/services/mentor-intake-idempotency.test.ts` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |
| `frontend/src/modules/mentorship/services/mentor-intake-idempotency.ts` | Persistir UUID por intención/sesión y reutilizarlo ante respuesta ambigua. |
| `frontend/src/shared/components/layout/sidebar-toggle-button.test.tsx` | Conservar regresiones y verificar contratos, concurrencia, migración o UI modificada. |

Este informe y la propuesta de PR son también archivos nuevos de documentación.

También se modificaron `frontend/src/shared/components/layout/app-sidebar.tsx` y `frontend/src/shared/components/layout/app-shell-roles.test.tsx`: el cierre y Escape ahora operan sobre openMobile en móvil, y una regresión usa el menú real con ese estado.

## C. Matriz de aceptación

Los estados reflejan evidencia local del código; no certifican la instalación remota ni la entrega en bandejas institucionales. Los nombres abreviados de pruebas corresponden a archivos en `backend/src/modules/mentors/tests`, `backend/src/modules/access-requests/tests` y módulos equivalentes de frontend.

| Issue | Criterio | Estado anterior | Corrección realizada | Prueba/evidencia | Estado final |
|---|---|---|---|---|---|
| #1386 | CA1. Confirmar participación | Cumplido y verificado | Se conserva la transacción de confirmación | offers.integration: confirma una vez bajo concurrencia | Cumplido y verificado |
| #1386 | CA2. Contador automático | Cumplido y verificado | Se conserva expiresAt absoluto | use-offer-countdown.test; slot-offer-participation.test | Cumplido y verificado |
| #1386 | CA3. Reabrir sin reiniciar plazo | Cumplido y verificado | Sin modificación de fecha | slot-offer-participation.test: cierre/reapertura | Cumplido y verificado |
| #1386 | CA4. Cancelar modal sin solicitud | Cumplido y verificado | Se conserva cierre sin mutación | no-slots-available-dialog.test; revisión de modal | Cumplido y verificado |
| #1386 | CA5. Carga y botones bloqueados | Cumplido y verificado | UUID compartido ante reintentos | mentorship-view.test; mentor-intake-idempotency.test | Cumplido y verificado |
| #1386 | CA6. Impedir cierre en procesamiento | Cumplido y verificado | Se conserva bloqueo por petición en curso | mentorship-view.test; slot-offer-participation.test | Cumplido y verificado |
| #1386 | CA7. Requisitos reales de elegibilidad | Parcial | Activación con OTP enlaza approvedUserId | approved-account-activation.integration; participation-fifo.integration | Cumplido y verificado |
| #1386 | CA8. Recalcular capacidad al enviar | Cumplido y verificado | Se conserva bloqueo compartido y CAPACITY_AVAILABLE | participation-fifo.integration; mentor-capacity.spec | Cumplido y verificado |
| #1386 | CA9. Duplicados en servidor | Parcial | Resultado persistido por usuario/operación/UUID | participation-fifo.integration: replay, conflicto y duplicados | Cumplido y verificado |
| #1386 | CA10. Creación con usuario/fecha/estado | Cumplido y verificado | Se conserva historial persistente | mentor-participation.integration; participation-fifo.integration | Cumplido y verificado |
| #1386 | CA11. Evitar segunda solicitud vigente | Cumplido y verificado | Se conserva original e informa 409 | participation-contract.spec; pending-participation.test | Cumplido y verificado |
| #1386 | CA12. Estado, fecha y tiempo transcurrido | Cumplido y verificado | Se conserva estado real | pending-participation.test; revisión visual de detalle | Cumplido y verificado |
| #1386 | CA13. Tiempo actualizado al reabrir | Cumplido y verificado | Se conserva fecha original | pending-slot-request-dialog.test; pending-participation.test | Cumplido y verificado |
| #1386 | CA14. Correo institucional y truncado | Cumplido y verificado | Se conserva correo del usuario autenticado | pending-slot-request-dialog.test; revisión visual móvil | Cumplido y verificado |
| #1386 | CA15. Navegar a Mi participación | Cumplido y verificado | Menú móvil vuelve a estar accesible | my-participation-view.test; sidebar-toggle-button.test; navegación local | Cumplido y verificado |
| #1386 | CA16. Abrir/cerrar detalle pendiente | Cumplido y verificado | Se conserva modal institucional | pending-participation.test; revisión visual y Escape | Cumplido y verificado |
| #1386 | CA17. Confirmar cancelación y perder prioridad | Cumplido y verificado | Se conserva advertencia FIFO | cancel-slot-request-dialog.test; pending-participation.test | Cumplido y verificado |
| #1386 | CA18. Cancelar y volver al inicio | Cumplido y verificado | Guardia síncrona de mutación | pending-participation.test; participation.integration | Cumplido y verificado |
| #1386 | CA19. CANCELLED sin reordenar ni avisar a terceros | Cumplido y verificado | Sin borrado; outbox solo para asignaciones | participation-fifo.integration; offers.integration | Cumplido y verificado |
| #1386 | CA20. Oferta sustituye estado pendiente | Cumplido y verificado | Se conserva consulta de oferta persistida | my-participation-view.test; offers.integration | Cumplido y verificado |
| #1386 | CA21. Fecha real y hora BOT | Cumplido y verificado | Se conserva America/La_Paz | use-offer-countdown.test; slot-offer-participation.test | Cumplido y verificado |
| #1386 | CA22. Vencer con pantalla abierta | Cumplido y verificado | Se conserva bloqueo y reconciliación | slot-offer-participation.test; offers.integration | Cumplido y verificado |
| #1386 | CA23. Consultar oferta expirada | Cumplido y verificado | Se conserva EXPIRED devuelto por backend | offers.integration; my-participation-view.test | Cumplido y verificado |
| #1386 | CA24. Consultar disponibilidad e incorporación | Parcial | Activación comparte política de intentos | mentor-capacity.spec; mentorship-view.test; participation-fifo.integration | Cumplido y verificado |
| #1386 | CA25. Clic fuera sin crear solicitud | Cumplido y verificado | Se conserva cierre del diálogo | no-slots-available-dialog.test | Cumplido y verificado |
| #1386 | CA26. Desenfoque al abrir modales | Cumplido y verificado | Se conserva overlay institucional | componentes de modales; revisión visual desktop/tablet/móvil | Cumplido y verificado |
| #1386 | CA27. Restauración al cerrar | Cumplido y verificado | Se conserva foco y retiro del overlay | pruebas de diálogos; revisión con Escape y Volver | Cumplido y verificado |
| #1386 | CA28. Reconciliar al liberar capacidad | Parcial | Worker existente despacha también outbox | mentor-exit.spec; offers.integration: worker y salida | Cumplido y verificado |
| #1386 | CA29. Un usuario por cupo | Parcial | Evento de correo en la misma transacción | offers.integration: asignadores/despachadores simultáneos | Cumplido y verificado |
| #1386 | CA30. Confirmaciones simultáneas | Cumplido y verificado | Se conserva reserva→rol una vez | offers.integration: confirma una vez bajo concurrencia | Cumplido y verificado |
| #1386 | CA31. Expirar sin visitas | Cumplido y verificado | Se conserva tick inicial y cada 15 segundos | mentor-offers-worker.spec; offers.integration | Cumplido y verificado |
| #1386 | CA32. Reasignación tras vencer | Cumplido y verificado | Se conserva siguiente FIFO/plazo nuevo | offers.integration: vence y reasigna sin visitas | Cumplido y verificado |
| #1386 | CA33. Nueva solicitud al final después de expirar | Cumplido y verificado | Se conserva ID y fecha nuevos | offers.integration; participation-fifo.integration | Cumplido y verificado |

### Subtareas y decisiones adicionales

Se incluyen los criterios completos de cada subtarea agrupados por comportamiento; los CA comunes remiten también a la tabla anterior.

| Issue | Criterio | Estado anterior | Corrección realizada | Prueba/evidencia | Estado final |
|---|---|---|---|---|---|
| #1395 | Disponibilidad real, modal FIFO, Cancelar/Solicitar, cierre y desenfoque | Cumplido y verificado | Se conserva la interfaz de PR1665; se corrige encabezado responsive | mentorship-view, no-slots-available-dialog y revisión local | Cumplido y verificado |
| #1407 | Carga, éxito/error, duplicados, pendiente, detalle, correo y sin posición FIFO | Cumplido y verificado | Se conserva consulta real y se añade bloqueo síncrono de edición/cancelación | pending-participation, pending-slot-request-dialog, my-participation-view | Cumplido y verificado |
| #1409 | Confirmación, pérdida de prioridad, endpoint DELETE, éxito/error y estado conservado | Cumplido y verificado | Guardia inmediata evita envíos múltiples antes de renderizar carga | pending-participation; participation-fifo.integration | Cumplido y verificado |
| #1410 | OFFERED, modal, BOT, reloj absoluto, rol activo y nueva solicitud tras vencer | Cumplido y verificado | Se conserva implementación integrada por #1665 y se corrige el aviso de vencimiento en la composición con HU6 | slot-offer-participation; participation-view; offers.integration | Cumplido y verificado |
| #1411 | Servicios reales, sincronización, errores y conservación de participación existente | Parcial | UUID persistido por intención, mensaje genérico 429, navegación móvil corregida | regresión de mentorías, acceso y layout; compilación Next | Cumplido y verificado |
| #1436 | Cuenta aprobada y vinculada; preferencias completas y catálogos válidos | Parcial | Consumo explícito del OTP de Epic1 con vínculo único y contraseña protegida | approved-account-activation.integration; esquemas y pruebas de mentoría | Cumplido y verificado |
| #1436 | 40 % redondeado, ocupación de activos+reservas, revalidación y concurrencia | Cumplido y verificado | Se conserva advisory lock común; reingreso reemplaza preferencias antiguas | mentor-capacity; participation-fifo.integration; offers.integration | Cumplido y verificado |
| #1436 | Reducción de capacidad sin revocación ni doble ocupación al confirmar reserva | Parcial | Caso PostgreSQL que convierte reserva vigente en mentor aun con capacidad reducida | offers.integration: conserva reserva al reducir capacidad | Cumplido y verificado |
| #1437 | Persistencia/ID/fecha, JWT, unicidad, edición sin reordenar, cancelación e historial | Cumplido y verificado | Se conserva SQL y restricciones vigentes; se elimina contador fijo de esta operación | participation.integration; participation-fifo.integration; contrato | Cumplido y verificado |
| #1438 | FIFO queuedAt/id, oferta única de 24h, confirmación atómica, vencimiento y nueva postulación | Cumplido y verificado | Evento OFFER atómico con asignación; worker se reutiliza | offers.integration, incluidas concurrencia y expiración exacta | Cumplido y verificado |
| #1439 | Ventana verdaderamente móvil compartida por ACTIVATE y REQUEST | Parcial | Historial individual con reloj PostgreSQL y filtro (ahora−24h, ahora] | participation-fifo.integration: mezcla de rutas y primer intento envejecido | Cumplido y verificado |
| #1439 | UUID obligatorio; replay por usuario+operación+clave; payload contradictorio | No cumplido | Hash de preferencias, unicidad y resultado persistido en la misma transacción | contrato HTTP; replay concurrente con cinco peticiones y un intento | Cumplido y verificado |
| #1439 | Primeros cuatro rechazos previstos cuentan; fallos técnicos revierten todo | Parcial | Rechazos de dominio se guardan; 5xx/errores internos abortan transacción | participation-fifo.integration: sin cupos, duplicado y rollback | Cumplido y verificado |
| #1439 | Quinto 429, exactamente 72h, sin extensión ni duplicados | Parcial | Una sanción y un evento; bloqueados posteriores no cuentan ni renuevan | participation-fifo.integration: siete solicitudes concurrentes | Cumplido y verificado |
| #1439 | MENTOR_REQUEST_SUSPENDED, sanctionEndsAt y Retry-After | Parcial | Filtro de dominio y CORS exponen Retry-After sin alterar wrapper | mentorship-response.spec por HTTP; integration de sanciones | Cumplido y verificado |
| #1439 | GET/edición/cancelación no cuentan; solicitud y oferta anteriores siguen válidas | Cumplido y verificado | Se mantiene política fuera de consultas y confirmaciones | participation-fifo.integration: confirma reserva durante sanción | Cumplido y verificado |
| #1440 | Citas futuras bloquean; salida revoca rol, desactiva, libera una vez y reasigna | Cumplido y verificado | Se conserva transacción, preferencias guardadas de HU6 y guardia frontend inmediata | mentor-exit.spec; offers.integration; participation-view.test | Cumplido y verificado |
| #1440 | Regreso con requisitos/FIFO; disponibilidad reversible Epic7 independiente | Cumplido y verificado | Reingreso directo reemplaza preferencias residuales; no se altera API reversible | mentor-availability.spec; mentor-exit.spec; suites availability | Cumplido y verificado |
| Decisiones B/E | Eventos y despacho solo a correo institucional, sin avisos de campana | No cumplido | Outbox transaccional con event_key único; proveedor existente MailService | offers.integration: eventos y despacho; Mailpit recibió oferta y sanción | Cumplido y verificado |
| Decisiones B/E | Entrega a bandeja institucional en el despliegue | No cumplido | Integración SMTP reutilizada, configuración externa exigida en producción | Entrega local verificada; no se inspeccionaron secretos ni bandejas reales | Implementado, pendiente de verificación externa |
| Infraestructura | Worker persistente tras reinicios y múltiples procesos | Cumplido y verificado | Tick al iniciar; DB durable; locks y SKIP LOCKED; despacho interrumpido aislado | worker/DB tests; deployment epic6 usa Deployment persistente | Cumplido y verificado |
| Migración | Conservar sanciones/datos anteriores | Parcial | Migración aditiva preserva sanción exacta, tabla anterior y conteos conocidos | mentor-intake-migration.integration | Cumplido y verificado |
| Migración | Reconstruir instantes individuales de intentos históricos | Parcial | No se inventan fechas: legacy conserva solo window_started_at y cantidad | El contador anterior carece de timestamps individuales; limitación documentada | Parcial |
| Accesibilidad | Foco, teclado, modales y medidas responsive | Parcial | Menú móvil usa openMobile; controles del encabezado se adaptan sin perder nombre accesible | sidebar-toggle-button/layout tests y revisión visual en tres tamaños | Cumplido y verificado |

## D. Pruebas

### Automatizadas

Validación inicial antes de sincronizar: 768 pruebas backend aprobadas, sin fallos ni casos pendientes; 767 pruebas frontend aprobadas en una ejecución completa y 88 pruebas de layout aprobadas tras la última corrección móvil (768 casos frontend distintos verificados en conjunto); 63 casos de integración distintos aprobados con PostgreSQL real. La regresión de la identidad aprobada incluye aprobación → OTP → login JWT → creación y consulta de la solicitud pendiente, sin asignar manualmente approvedUserId. La validación de la sincronización se documenta al final.

ESLint backend/frontend, TypeScript de ambos proyectos, compilación backend, Prisma validate y compilación Next con 42 páginas pasaron. Oxlint no reportó errores; conserva una advertencia de método sin enlazar en un test de controlador existente. `git diff --check` pasó.

Los intentos fallidos anteriores se detallan para no confundir una ejecución parcial con una regresión aprobada.

Desde `backend`:

```powershell
node node_modules/vitest/vitest.mjs run src/modules/mentors src/modules/access-requests src/modules/mail src/modules/auth src/modules/availability --exclude '**/*.integration.spec.ts' --maxWorkers 2
$env:HU7_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:5434/postgres'
$env:HU7_TEST_SMTP_PORT='1037'
node node_modules/vitest/vitest.mjs run src/modules/mentors/tests/mentor-participation.integration.spec.ts src/modules/mentors/tests/mentor-participation-fifo.integration.spec.ts src/modules/mentors/tests/mentor-offers.integration.spec.ts src/modules/access-requests/tests/approved-account-activation.integration.spec.ts --maxWorkers 1
node node_modules/vitest/vitest.mjs run src/modules/mentors/tests/mentor-intake-migration.integration.spec.ts --maxWorkers 1
node node_modules/typescript/bin/tsc -p tsconfig.build.json
node scripts/copy-mail-templates.ts
node node_modules/prisma/build/index.js validate --config prisma7.config.ts
```

Desde `frontend`:

```powershell
node node_modules/vitest/vitest.mjs run src/modules/mentors src/modules/mentorship src/modules/access-request src/shared/components/layout --maxWorkers 2
node node_modules/typescript/bin/tsc --noEmit
node node_modules/next/dist/bin/next build --webpack
```

Se ejecutaron también ESLint sobre los archivos fuente modificados de ambos proyectos y oxlint con análisis de tipos en backend. La compilación Next usa los valores locales de API y, en este entorno, la caché local de Inter/Inter Tight mediante la opción de pruebas de next/font; no se cambió ninguna variable real ni código de fuentes del proyecto. Se generaron 42 páginas, incluida la activación de cuenta.

La entrega SMTP se comprobó separadamente de la creación de eventos: dos mensajes aceptados y recibidos por Mailpit local, oferta y sanción. Ningún correo se dirigió a una cuenta real.

### Revisión visual y teclado

Se revisó la interfaz servida por la compilación nueva, con backend y base local separados de la demostración anterior. Medidas: escritorio 1440×900, tablet 768×1024 y móvil 390×844. Tras corregir el encabezado, el ancho del documento quedó dentro del viewport en los tres tamaños. El detalle pendiente muestra la fecha persistida, tiempo transcurrido, correo y desenfoque sin desbordamiento. Se comprobaron apertura/cierre del menú móvil, cierre del detalle, Escape y recuperación de interacción.

Las pruebas automatizadas cubren además cierre durante petición, error y conservación de estado, correo largo, plazo absoluto, expiración con pantalla abierta y confirmación. La revisión visual local no certifica todos los navegadores físicos ni la bandeja institucional del despliegue.

Se recorrió también la oferta por navegador contra la API local: mostró su expiresAt en BOT y contador decreciente; al confirmar, apareció «Participación confirmada correctamente», el estado Activo y los enlaces del rol Mentor. La solicitud y la reserva utilizadas eran exclusivamente de la base local aislada.

### Fallos durante la implementación

- El primer intento dentro del sandbox no pudo renombrar la caché temporal de Vitest. Se repitió con ejecución normal; no se modificó la configuración del runner.
- Las pruebas PostgreSQL detectaron preferencias residuales al reingresar. Se corrigió el reemplazo transaccional y se mantuvo el caso de prueba.
- La comparación de replay se ajustó a igualdad de JSON sin depender del orden de claves de JSONB. El contrato HTTP mantiene fechas y valores iguales.
- Se actualizaron los contratos de tests que aún omitían Idempotency-Key. No se quitaron pruebas.
- Cuatro módulos de pruebas HTTP de Epic 1 carecían del nuevo proveedor de activación: 30 casos no llegaron a ejecutarse. Se registró su mock y la regresión final backend pasó sin casos pendientes.
- Una prueba nueva de UI necesitó cleanup explícito; una prueba previa agotó su tiempo durante compilaciones concurrentes. Ambas se repitieron correctamente antes de la ejecución final.
- La descarga remota de Google Fonts produjo un error en next/font. La compilación final pasó usando archivos de las mismas fuentes ya disponibles en caché, exclusivamente para la verificación local.

## E. Operación, migración y riesgos

### Contrato público

Ambos POST de entrada exigen `Idempotency-Key: UUID`. Se sigue obteniendo el usuario de JWT y rechazando userId en el cuerpo. La clave se particiona por usuario y operación; las preferencias se normalizan para calcular el hash. Repetir un resultado ya confirmado no crea otra solicitud/rol ni incrementa intentos. Una clave con otros datos produce 409 `IDEMPOTENCY_KEY_CONFLICT`.

El quinto intento distinto devuelve 429 con `data.code=MENTOR_REQUEST_SUSPENDED`, `data.sanctionEndsAt` y `Retry-After`. Los rechazos de negocio previstos cuentan; un fallo técnico revierte todas las escrituras. Consultas, edición, cancelación, confirmación y salida no pasan por ese contador. Los intentos bloqueados posteriores no renuevan las 72 horas. Un replay después del fin conserva el resultado original: una intención nueva necesita otra clave.

### Migración

Aplicar `20261027030000_mentor_intake_idempotency_outbox` con el procedimiento existente de Prisma antes de ejecutar el backend nuevo. Crea tres tablas nuevas y conserva la tabla de contador anterior y sus datos. Importa sanciones conocidas sin cambiar su fin y prepara eventos pendientes para sanciones vigentes/ofertas actuales. Las fechas de intentos nuevos usan el reloj PostgreSQL.

El contador anterior no guardaba timestamps individuales. Solo es posible conservar su cantidad reciente en window_started_at; no reconstruir una historia móvil exacta retroactivamente. Esta limitación no afecta los intentos registrados por el código nuevo. No se borra historial para ocultarla. La coexistencia de instancias viejas que escriban el contador fijo y nuevas que escriban el historial no está soportada: detener la versión anterior antes de habilitar la nueva. El Deployment de Epic 6 consultado usa estrategia Recreate.

### Correo y recuperación

Se reutiliza MailModule/MailService; no hay segundo proveedor ni notificaciones internas de HU7. El evento se crea dentro de la transacción de negocio; SMTP ocurre después, fuera de ella. Dos despachadores reclaman eventos con SKIP LOCKED y conservan el mismo Message-ID.

PENDING se reintenta ante un rechazo explícito o fallo anterior a aceptación; SENT requiere aceptación SMTP. Una oferta ya terminada se marca SUPERSEDED sin enviarse. SENDING abandonado o resultado SMTP ambiguo pasa a UNCERTAIN y no se reenvía automáticamente. SMTP no permite demostrar entrega exactamente una vez si el proceso cae después de que el servidor recibió DATA: para no duplicar, se exige reconciliar esos casos en el proveedor antes de autorizar un reintento manual. No se presenta UNCERTAIN ni transporte console como entrega exitosa. Tras diez fallos se requiere revisión operativa.

Para verificación externa faltan valores y acceso de prueba del despliegue: MAIL_TRANSPORT=smtp, MAIL_FROM_ADDRESS verificado, SMTP_HOST, SMTP_PORT, SMTP_USER/SMTP_PASSWORD y SMTP_SECURE o SMTP_REQUIRE_TLS. Son parámetros del proveedor existente. No se leyeron ni modificaron secretos reales. Deben comprobarse recepción en dominio institucional, reputación y configuración SPF/DKIM/DMARC del proveedor; la recepción local no demuestra ese último tramo.

El [manifiesto Epic 6](https://github.com/UMSSY/umssy-app-deploy/blob/main/backend/epic6/deployment.yml) declara un contenedor persistente, compatible con el worker actual de 15 segundos. No se modificó ni desplegó ese repositorio. Sigue pendiente verificar la imagen, migraciones y configuración efectiva remotas. En un runtime que se suspenda entre peticiones haría falta garantizar la ejecución persistente de este worker.

### Epic 1 y Epic 7

El enlace de aprobación consume el OTP existente, exige aprobación vigente, limita intentos, rechaza códigos usados/vencidos y actualiza approvedUserId atómicamente. Para una cuenta existente exige su contraseña actual y conserva su hash; no permite resetearla con el OTP. Crea cuenta/rol titulado únicamente al acreditar el código institucional. El login JWT existente permanece intacto.

La salida definitiva usa las citas y estados existentes de Epic 7 y mantiene la disponibilidad reversible separada. Una reserva vigente sigue comprometida aunque baje la capacidad: confirmarla reduce reservas e incrementa activos una sola vez; no se revocan mentores ni se admiten nuevos cupos cuando no hay capacidad real.

## F. Pull request preparado

Ver [propuesta de PR](hu7-main-flow-pr.md) y [PR1713](https://github.com/UMSSY/umssy-app/pull/1713), abierto hacia `epic/grupo-6-red-mentorias`.

## G. Sincronización con Epic 6

Se resolvieron los cuatro conflictos de `da499bb6`: la sustitución de preferencias en el repositorio de mentores, sus dos fixtures de pruebas y la eliminación del modal antiguo. El reemplazo de preferencias se ejecuta una sola vez, dentro de la transacción que conserva elegibilidad, capacidad e idempotencia. Se mantuvieron los escenarios de las dos ramas.

HU6 conserva áreas y orientaciones al finalizar la participación. Esos datos precargan la reincorporación, pero no conservan rol, cupo ni turno FIFO: las pruebas PostgreSQL verifican ENDED/DEACTIVATED, una única liberación, la oferta al siguiente y un regreso sujeto a capacidad y elegibilidad. La disponibilidad reversible de Epic 7 permanece independiente.

La composición nueva muestra el vencimiento a usuarios NEVER y DEACTIVATED y permite volver al proceso normal de incorporación. Se mantuvo el nombre Pausar mentoría y se aclaró la pérdida definitiva de rol, cupo y prioridad en el modal reutilizado.

Las claves de idempotencia se conservan ante respuestas ambiguas. Una cancelación, confirmación o salida reconocida por el servidor termina la intención correspondiente; también la termina el inicio explícito de otra incorporación después de un estado cerrado. No se reinician por recargar el formulario, consultar el estado o por una salida fallida. Esto evita reproducir el resultado antiguo al solicitar de nuevo con las mismas preferencias.

Validación de la sincronización:

- Backend: 772 casos aprobados en conjunto. La ejecución concurrente dejó 26 contratos HTTP inconclusos por un fallo del runner; se repitió esa suite completa de forma aislada y pasaron sus 26 casos. Ninguna prueba fue eliminada o desactivada.
- Frontend completo: 3.134 casos aprobados y un timeout de 5 segundos en certificaciones. La regresión final de mentorías y ese archivo pasó sus 309 casos, incluyendo cuatro casos nuevos de ciclo de idempotencia. Al combinar las ejecuciones quedan 3.139 casos aprobados, sin fallos pendientes.
- PostgreSQL: 63 casos aprobados; verifican preferencias conservadas al salir, ausencia de rol/cupo/turno conservado y regreso por FIFO, además de idempotencia, sanciones y correo.
- TypeScript, compilaciones backend y Next.js de producción (42 páginas), ESLint y comprobación de diff: aprobados. Se conserva la advertencia previa de unbound-method en un test backend.
- HTTP local: login, GET /mentors/me/participation, solicitud actual y capacidad responden correctamente. La cuenta de prueba conserva estado ACTIVE, sus preferencias y una ocupación de 4/4; el frontend responde 200.
- Navegador: se verificaron la vista nueva, el botón Pausar mentoría y su confirmación; cancelar el modal conserva la participación. Los servidores locales se actualizaron sin reiniciar ni sembrar la base de datos.
