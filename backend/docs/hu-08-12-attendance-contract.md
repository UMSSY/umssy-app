# HU-08-12 · Contrato de asistencia en línea

Este contrato fija la integración FE/BE. La tarea 12.1 añade el esquema de entrada y la autorización interna; **el endpoint se habilita en 12.2**, cuando exista persistencia idempotente. No se debe presentar la simulación del escáner como un registro real antes de esa integración.

## Supuestos basados en el sistema actual

- Responsable autorizado: usuario activo con rol `titulado` que figura en `Event.createdById` de un taller `Publicado`. `moderatedById` es revisión de propuestas, no permiso de escaneo. No se concede acceso general a otros titulados o administradores.
- El pase real muestra `v1:` seguido del `qrToken` hexadecimal de 64 caracteres. La entrada manual acepta ese token completo, con o sin `v1:`. Los UUID y códigos cortos del modo demostración no son credenciales válidas; si producto requiere un código corto, necesitará diseño y almacenamiento propios antes de habilitarlo.
- Ventana propuesta para 12.3: desde el inicio hasta antes del fin del taller, interpretados en hora de Bolivia (UTC−4). La decisión definitiva debe confirmarse con el PO antes de implementar 12.3.
- Una cancelación invalida el QR. La reactivación existente emite un nuevo token; el anterior no vuelve a ser válido. La asistencia previa de una inscripción reactivada requiere una regla de negocio explícita si se permite cancelar después del check-in.

## Solicitud prevista

`POST /api/events/:eventId/attendances/check-ins` con sesión Bearer válida, sin caché. `eventId` es UUID. Cuerpo JSON estricto: `{ "reference": "v1:<64 hex>" }` o `{ "reference": "<64 hex>" }`. El token nunca se envía en la URL, ni se registra en logs. No se acepta `userId`, `registrationId` ni un taller alternativo enviados por el cliente.

El backend primero comprueba el rol y la titularidad del taller seleccionado. Solo después busca el pase **dentro de ese taller**. Un pase de otro taller y un token inexistente son indistinguibles para la respuesta externa.

## Respuestas previstas

| HTTP | Código o resultado | Texto de interfaz | Regla |
| --- | --- | --- | --- |
| 201 | `data.result = registered` | Pase válido / Asistencia registrada | Se crea una asistencia. |
| 200 | `data.result = duplicate` | Asistencia ya registrada | No se modifica la asistencia original. |
| 400 | `VALIDATION_ERROR` | Referencia inválida | Formato o campos no admitidos. |
| 401 | `UNAUTHENTICATED` | Iniciar sesión | Sesión ausente o expirada. |
| 403 | `FORBIDDEN_ROLE` o `ATTENDANCE_ACCESS_DENIED` | Sin permiso | Rol no permitido o taller no gestionado. |
| 409 | `ATTENDANCE_OUTSIDE_WINDOW` | Fuera de la ventana horaria de validación | Regla de 12.3. |
| 422 | `ATTENDANCE_PASS_INVALID` | Pase inválido | Token inexistente, otro taller o inscripción no confirmada. |
| 422 | `ATTENDANCE_PASS_CANCELLED` | Pase inválido - Inscripción cancelada | Solo si el pase cancelado pertenece al taller autorizado. |

Las respuestas exitosas incluyen solo `result` y `checkedInAt` (ISO 8601) dentro de la envoltura API existente. Las respuestas de error siguen `{ statusCode, ok: false, code, detail, data: null }`. Ninguna respuesta enumera participantes ni devuelve el token o la referencia. La hora, permisos y resultado final siempre los decide el servidor.
