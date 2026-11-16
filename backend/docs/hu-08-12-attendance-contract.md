# HU-08-12 · Contrato de asistencia en línea

Este contrato fija la integración FE/BE. La tarea 12.1 añade el esquema de entrada y la autorización interna; **el endpoint se habilita en 12.2**, cuando exista persistencia idempotente. No se debe presentar la simulación del escáner como un registro real antes de esa integración.

## Decisiones basadas en el sistema actual

- Responsable autorizado: usuario activo con rol `titulado` que figura en `Event.createdById` de un taller `Publicado`. Actualmente solo el titulado crea talleres; el rol `mentor` por sí solo no habilita el escaneo. `moderatedById` es revisión de propuestas, no permiso de escaneo. No se concede acceso general a otros titulados o administradores.
- El pase real muestra `v1:` seguido del `qrToken` hexadecimal de 64 caracteres. El registro acepta ese valor, el token sin prefijo y el UUID de `EventRegistration.id` como referencia manual. El UUID se comprueba dentro del taller gestionado y solo sirve si la inscripción está confirmada.
- El código corto todavía no tiene contrato ni columna de persistencia. La propuesta de generarlo al emitir el pase y revelarlo con «Usar código» necesita acuerdo FE/BE antes de habilitarlo. Debe ser aleatorio, único, no derivado del UUID y protegido contra intentos masivos; ocultarlo en la interfaz no lo convierte por sí solo en una credencial secreta. Por ahora el backend rechaza códigos cortos aunque el escáner de demostración los reconozca.
- Ventana pendiente para 12.3: permitir escaneo únicamente el mismo día local del taller en Bolivia (UTC−4) y cerrarlo al alcanzar la hora de finalización. QA definirá si se abre a las 00:00, dos horas antes o al inicio. No se codifica una apertura provisional en 12.1.
- Una cancelación invalida el QR. La reactivación existente emite un nuevo token; el anterior no vuelve a ser válido. El UUID de la inscripción permanece estable y, al volver a confirmarse, vuelve a ser aceptado como entrada manual. La asistencia previa de una inscripción reactivada requiere una regla de negocio explícita si se permite cancelar después del check-in.

## Solicitud prevista

`POST /api/events/:eventId/attendances/check-ins` con sesión Bearer válida, sin caché. `eventId` es UUID. Cuerpo JSON estricto: `{ "reference": "v1:<64 hex>" }`, `{ "reference": "<64 hex>" }` o `{ "reference": "<UUID de inscripción>" }`. La referencia nunca se envía en la URL ni se registra en logs. No se aceptan `userId`, `registrationId` como campo adicional ni un taller alternativo enviados por el cliente.

El backend primero comprueba el rol y la titularidad del taller seleccionado. Solo después busca el pase **dentro de ese taller**. Una referencia de otro taller y una inexistente son indistinguibles para la respuesta externa.

## Respuestas previstas

| HTTP | Código o resultado | Estado de interfaz | Regla |
| --- | --- | --- | --- |
| 201 | `data.result = registered` | Registrado | Se crea una asistencia. |
| 200 | `data.result = duplicate` | Duplicado | No se modifica la asistencia original. |
| 400 | `VALIDATION_ERROR` | Error | Formato o campos no admitidos. |
| 401 | `UNAUTHENTICATED` | Error / iniciar sesión | Sesión ausente o expirada. |
| 403 | `FORBIDDEN_ROLE` o `ATTENDANCE_ACCESS_DENIED` | Error | Rol no permitido o taller no gestionado. |
| 409 | `ATTENDANCE_OUTSIDE_WINDOW` | Error | Regla de 12.3. |
| 422 | `ATTENDANCE_PASS_INVALID` | Inválido | Referencia inexistente, otro taller o inscripción no confirmada. |
| 422 | `ATTENDANCE_PASS_CANCELLED` | Inválido | Inscripción cancelada del taller autorizado. |

Los cuatro estados finales del escáner son registrado, duplicado, inválido y error; «verificando» es transitorio. Las respuestas exitosas incluyen solo `result` y `checkedInAt` (ISO 8601) dentro de la envoltura API existente. Las respuestas de error siguen `{ statusCode, ok: false, code, detail, data: null }`. Ninguna respuesta enumera participantes ni devuelve el token o la referencia. La hora, permisos y resultado final siempre los decide el servidor.
