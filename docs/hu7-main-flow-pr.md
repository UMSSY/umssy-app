# Descripción preparada para PR1713

**Título:** fix(mentors): completar admisión HU7 con idempotencia, sanciones y correo transaccional

**Origen:** `feature/grupo-6-hu7-main-flow-correction`
**Destino:** `epic/grupo-6-red-mentorias`

## Problema y resultado

La activación directa y la espera tenían políticas de intentos distintas; el contador era fijo, los reintentos no tenían identidad persistente y las ofertas/sanciones no se despachaban mediante correo transaccional. La admisión ahora comparte una ventana móvil real, claves UUID y una sola sanción exacta de 72 horas al quinto intento distinto, conservando solicitudes y ofertas previas.

Se mantiene el FIFO y el mecanismo existente de reservas de 24 horas, confirmación, expiración y salida definitiva. Se completa el vínculo de cuentas aprobadas consumiendo el OTP institucional de Epic 1 sin cambiar el login. Se corrigen envíos repetidos, preferencias residuales al volver a participar y navegación móvil detectada durante QA.

## Cambios

- UUID obligatorio en ambas rutas de entrada; resultado persistido por usuario, operación y clave, conflicto ante otros datos y rollback ante fallos técnicos.
- Respuesta 429 con MENTOR_REQUEST_SUSPENDED, sanctionEndsAt y Retry-After; mensaje genérico en frontend.
- Outbox atómico para ofertas y sanciones, proveedor MailService existente, reclamo concurrente seguro y recuperación explícita de entregas inciertas.
- Activación aprobada: OTP válido de un solo uso, approvedUserId explícito y contraseña actual obligatoria para vincular una cuenta existente.
- UUID de frontend conservado después de fallos de red/5xx, bloqueo inmediato de mutaciones y controles móviles accesibles.
- Ninguna revocación automática por reducción de capacidad; una reserva vigente se confirma sin doble ocupación.
- Sincronización con Epic 6 en da499bb6 (#1705 y #1711): conserva el panel activo/desactivado y las preferencias de HU6, reutiliza su modal para la salida definitiva de HU7 y mantiene visible el vencimiento de ofertas.
- Las intenciones de idempotencia terminan solo ante una operación reconocida o una incorporación nueva explícita después de cerrar la anterior; recargar, reintentar o fallar una salida conserva la clave.
- Documentación con 33 CA y requisitos adicionales: [informe](hu7-main-flow-correction.md).

## Validación

- Backend: 772 comprobaciones aprobadas. Se repitieron aisladamente los 26 contratos HTTP que el runner concurrente dejó inconclusos.
- Frontend: ejecución completa con 3.134 aprobadas y un timeout en certificaciones. La regresión final de mentorías y ese archivo pasó sus 309 casos; en conjunto se verificaron 3.139 casos sin fallos pendientes.
- PostgreSQL: 63 casos distintos verificados en esquemas temporales locales, incluidos concurrencia, replay, ventana móvil, reservas con capacidad reducida, migración y aprobación→OTP→login→espera.
- SMTP local: oferta y sanción recibidas en Mailpit; los reintentos no duplican eventos.
- TypeScript, Prisma validate, compilaciones backend y Next.js (42 páginas), ESLint sin errores. Oxlint sin errores; una advertencia existente de unbound-method en un test de controlador.
- Las verificaciones visuales y limitaciones de entrega externa están detalladas en el informe.
- HTTP y navegador locales: panel ACTIVE, preferencias reales, capacidad 4/4 y confirmación inequívoca de Pausar mentoría; cancelar conserva el estado.

## Migración y puesta en marcha

Aplicar `20261027030000_mentor_intake_idempotency_outbox` antes de arrancar la versión nueva y regenerar el cliente Prisma. Es aditiva: conserva las tablas e historial existentes e importa sanciones vigentes sin renovar su fecha. No admite convivencia con instancias anteriores que sigan escribiendo el contador fijo; usar el procedimiento Recreate existente.

El frontend y backend deben actualizarse coordinadamente, porque ambos POST exigen Idempotency-Key. El contenedor persistente de Epic 6 mantiene el worker existente. No se modificó el repositorio de despliegue ni secretos reales.

## Limitaciones conocidas

La recepción en bandejas institucionales del despliegue queda pendiente de verificación externa de SMTP/remitente. Mailpit confirma transporte y recepción local, no reputación o entrega remota.

SMTP no proporciona exactamente una vez ante una caída después de DATA. Un evento ambiguo o abandonado queda UNCERTAIN para reconciliar con el proveedor; no se reenvía automáticamente ni se afirma que esté entregado. Se reintentan únicamente fallos previos a aceptación o rechazos explícitos.

El contador histórico solo contenía cantidad y comienzo de ventana. Se conservan esos datos conocidos; no se pueden reconstruir timestamps individuales anteriores. Los intentos nuevos usan ventana móvil exacta.

## Relación con issues

Relacionadas: #1386, #1395, #1407, #1409, #1410, #1411, #1436, #1437, #1438, #1439 y #1440. No incluye instrucciones de cierre automático.

No contiene datos de demostración, cuentas sembradas en producción, archivos de entorno, bases locales ni logs.
