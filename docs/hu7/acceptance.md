# HU7 — matriz de los 33 criterios de la issue #1386

> Actualización v3, 24/10/2026: «Pausar mentoría» HU7 revoca el rol y libera cupo. La tabla histórica de abajo registra la verificación del 23/10; para el estado y las cuentas actuales usar [README.md](README.md) y [evidence.md](evidence.md).

Fuentes: [issue oficial](https://github.com/UMSSY/umssy-app/issues/1386), leída el 23/10/2026, y `C:\Users\usuario\Downloads\hu7.pdf` (dos páginas, seis mockups y 16 criterios), inspeccionado visualmente. `Verificado` indica observación local con PostgreSQL, API, Next.js o Mailpit; `Pendiente` indica que aún falta el escenario concreto.

| AC | Estado | Implementación y evidencia aún necesaria |
|---:|---|---|
| 1 | Pendiente | Confirmación transaccional de oferta y rol mentor; probar en API/UI. |
| 2 | Verificado | `hu7.07`: modal y panel mostraron contador descendente y límite BOT. |
| 3 | Pendiente | Usa `expiresAt` persistido; falta reabrir y comparar con BD tras recarga. |
| 4 | Verificado | `hu7.07`: “Volver” cerró el modal y conservó `OFFERED` en el panel. |
| 5 | Pendiente | Botones bloqueados durante solicitud; simular red lenta. |
| 6 | Pendiente | Modal controlado impide cierre fuera/Esc durante POST; probar teclado. |
| 7 | Verificado | Login real; `hu7.no-aprobado` recibió 403 por API sin solicitud creada. |
| 8 | Pendiente | Recalcula bajo lock; responde `SLOT_AVAILABLE` y vuelve al wizard; probar carrera. |
| 9 | Verificado | Dos POST de `hu7.22`: el segundo recibió 409 y no creó otro vigente. |
| 10 | Verificado | `hu7.12`: solicitud `PENDING` desde formulario y correo del outbox en Mailpit. |
| 11 | Verificado | Segundo POST de `hu7.22`: 409 con mismo ID y fecha. |
| 12 | Verificado | `hu7.08`: panel muestra PENDIENTE, fecha BOT y tiempo transcurrido. |
| 13 | Pendiente | Tiempo se calcula desde fecha servidor; falta recarga manual específica en espera. |
| 14 | Pendiente | Correo `User.email` con `truncate` y `title`; móvil. |
| 15 | Verificado | `/mentors/participation` mostró estados distintos para usuarios autenticados `hu7.01`, `.07`, `.08` y `.12`. |
| 16 | Verificado | `hu7.08`: modal “Estado: Pendiente” con fecha, tiempo, áreas, orientaciones y correo. |
| 17 | Verificado | `hu7.08`: diálogo de cancelación avisa pérdida del turno FIFO. |
| 18 | Parcial | `hu7.22` quedó `CANCELLED` por API; falta observar su pantalla de éxito. |
| 19 | Pendiente | Sale de cola sin tocar posición ajena; consultar BD. |
| 20 | Verificado | `hu7.07`: panel de oferta y modal reemplazaron la espera. |
| 21 | Verificado | Oferta semilla a 24 horas, con fecha BOT y cuenta regresiva en navegador. |
| 22 | Pendiente | Al llegar `expiresAt`, CTA de nueva solicitud y bloqueo; reloj simulado. |
| 23 | Pendiente | `GET /me` reconcilia vencimiento; recargar. |
| 24 | Verificado | `GET /capacity`: 25 aprobados, capacidad 10, ocupados 10; `hu7.12` vio “No hay cupos disponibles” y registró solicitud. |
| 25 | Pendiente | Base UI cierra modal inactivo al pulsar backdrop; falta interacción manual específica. |
| 26 | Verificado | Los modales de oferta, detalle, cancelación y sin cupos mostraron overlay difuminado. |
| 27 | Verificado | Cerrar oferta/detalle/cancelación restauró el panel sin perder estado. |
| 28 | Verificado v3 | «Pausar mentoría» HU7 revocó rol, redujo mentores 9→8 y luego 8→7, y asignó una oferta FIFO por cada cupo. Dos POST concurrentes sobre el mismo mentor liberaron solo uno. El switch reversible de Epic 7 es otro contrato. |
| 29 | Pendiente | Cola FIFO y decremento de cupo por oferta; prueba con 2 pendientes. |
| 30 | Pendiente | Lock global y confirmación repetida; prueba concurrente. |
| 31 | Pendiente | Worker cada 15 s sin visita; comprobar con BD local. |
| 32 | Pendiente | Vencimiento cierra solicitud y ofrece al siguiente; reloj simulado/BD. |
| 33 | Pendiente | Solicitud vencida histórica y nueva con otro ID y `queuedAt`; seed `hu7.10` y prueba. |

## Reglas acordadas adicionales

| Regla | Estado de verificación |
|---|---|
| Denominador: titulados activos con rol vigente y `AccessRequest.approvedUserId` explícito en estado `approved` | Conteo real 25 vinculados en DB local. |
| 40% con `Math.floor`; cero titulados | Capacidad 10 de 25 observada; caso cero cubierto por tests dirigidos. |
| Pausa HU7 libera un cupo y revoca rol; se bloquea con cita futura `PENDIENTE` o `CONFIRMADA` | `mentor.b` recibió 409 sin cambios; `.02` y `.03` quedaron `LEFT`, con una oferta FIFO por cada salida. |
| Cancelación de oferta libera reserva y entrega a FIFO | Implementado; pendiente prueba concurrente. |
| Oferta vence tanto `MentorSlotOffer` como `MentorParticipationRequest` | Implementado; pendiente prueba con reloj simulado. |
| Correo SMTP solo a Mailpit local, outbox y reintento | Cinco mensajes reales observados en Mailpit; reintento tras caída del servicio pendiente. |
| Historial de solicitudes no se elimina | Restricciones `RESTRICT` y estados terminales; pendiente consulta de BD. |

Los seis mockups se revisaron en el orden en que aparecen en la primera página del PDF: aviso sin cupos, oferta con contador, detalle pendiente, participación activa, espera y cancelación. Se reprodujeron esos seis estados en el navegador local de ancho reducido. Queda revisión fina del diseño de escritorio y accesibilidad.

## Comprobación adicional v3 (24/10/2026)

| Criterio nuevo | Resultado observado en localhost |
|---|---|
| Intentos distintos 1–4, quinto y sexto | Cuatro `409` por solicitud pendiente o `NO_SLOTS`; quinto `429` con `MENTOR_REQUEST_SUSPENDED`, fecha UTC y `Retry-After` de ~72 h; sexto mantuvo la misma sanción. |
| Idempotencia y concurrencia | Repetir la misma clave conservó `sanctionEndsAt`. Cinco POST concurrentes dieron cuatro `409` y un `429`, con una sola sanción y un solo outbox. El helper frontend conserva la clave tras fallo de red. |
| Ventana móvil y 72 horas exactas | Cuatro intentos fuera de 24 h no sancionaron. Cinco recientes sí. A 71 h 59 min hubo `429`; al llegar 72 h volvió a evaluar el cupo (`409 NO_SLOTS`). |
| Solicitud/oferta preexistente | `.10` mantuvo su solicitud, ID y `requestedAt` tras sanción; después recibió oferta FIFO sin que la sanción la cancelase. |
| Correo de sanción | Mailpit recibió un aviso por sanción. Apagado: outbox `PENDING` y sanción vigente. Restaurado: `SENT` tras reintento y un solo mensaje para `.19`. |
| Pausa y citas | `mentor.b` con cita futura: 409 `FUTURE_APPOINTMENTS` y rol activo. `.02` y `.03` pausaron, perdieron rol y liberaron exactamente un cupo cada uno. Dos llamadas concurrentes a `.03` dieron una baja y una respuesta `alreadyLeft`. |
| Regreso sin prioridad | `.02` volvió a `titulado`, recibió `NO_SLOTS`, creó solicitud nueva y más tarde obtuvo oferta FIFO; no se restituyó su rol anterior. |
| Epic 7/HU8 | Se conservaron `MentorsService.updateAvailability` y `MentorsRepository.updateAvailability`: su disponibilidad reversible no debe confundirse con la baja HU7. Falta coordinación si el producto pretende un solo control visual. |
