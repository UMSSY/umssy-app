# F1: entrada al detalle de rechazo desde el correo

## Alcance

F1 conserva el diseño de escritorio del rechazo y prepara su entrada desde el correo.
No añade OTP, endpoints, tokens de escritura, cambios en Prisma ni cambios en MailSender.
No ofrece una consulta manual por código SOL y correo.

## Contrato que consume el frontend

Ruta existente: `/request-access/status`.
Identificación esperada: un único parámetro `code`, por ejemplo
`/request-access/status?code=SOL-2026-0001`.

- El código identifica la solicitud; no es una credencial ni autoriza escrituras.
- F1 rechaza parámetros ausentes, vacíos, repetidos o con formato inválido, sin consultar B1.
- F1 solicita únicamente el correo registrado y no lo incorpora a la URL del frontend.
- La consulta reutiliza `accessRequestService.getRequestStatus(code, email)`:
  `GET /access-requests/status/{code}` con el parámetro `email` del contrato B1 existente.
- Solo se muestran datos después de una respuesta exitosa correspondiente al código solicitado.
- Los fallos 400/403/404/500, de red o inesperados muestran el mismo mensaje genérico.
- Cambiar el enlace descarta el correo, los errores y los datos anteriores.
- El resultado rejected usa RequestStatusDetails sin modificar su diseño ni sus recomendaciones.
- Los otros estados siguen usando la presentación existente sin exponer nombre ni motivo de rechazo.

La dirección de correo coincidente verifica una combinación de datos en B1; no demuestra
por sí sola control de la cuenta de correo. Es la comprobación básica acordada para esta
entrega, no una autorización para reemplazar documentos.

## Dependencia real de B3 (#1556)

Inspección de la rama `epic/grupo-1-identity-backoffice-onboarding` el 28/10/2026:

1. `AccessRequestsModule` enlaza `MAIL_SENDER` con `ConsoleMailSender`.
2. `ConsoleMailSender.sendRejection(to, reason)` solo escribe un log; no genera un correo ni un enlace.
3. La interfaz `MailSender.sendRejection(to, reason)` recibe destinatario y motivo, sin código SOL.
4. `RejectionNotificationService.notify(email, reason, accessRequestId)` recibe un ID interno,
   pero llama al MailSender únicamente con email y reason.

Por tanto, una plantilla MJML con un enlace estático no completa la integración.
B3 necesita entregar el identificador correcto en el enlace y contar con envío operativo.
El flujo actual no transporta ese identificador hasta la plantilla. La solución de ese
contrato debe acordarse con el responsable técnico: este cambio de F1 no modifica la
interfaz MailSender, sus invocaciones ni los contratos backend.

El consumidor frontend de `?code=` está preparado; la emisión real del enlace y la
prueba completa correo → detalle siguen dependiendo de B3.

Fuentes revisadas:

- https://github.com/UMSSY/umssy-app/issues/1556
- https://github.com/UMSSY/umssy-app/blob/epic/grupo-1-identity-backoffice-onboarding/backend/src/modules/access-requests/access-requests.module.ts
- https://github.com/UMSSY/umssy-app/blob/epic/grupo-1-identity-backoffice-onboarding/backend/src/modules/access-requests/mail/mail-sender.ts
- https://github.com/UMSSY/umssy-app/blob/epic/grupo-1-identity-backoffice-onboarding/backend/src/modules/access-requests/mail/console-mail-sender.ts
- https://github.com/UMSSY/umssy-app/blob/epic/grupo-1-identity-backoffice-onboarding/backend/src/modules/access-requests/services/rejection-notification.service.ts

## Dependencias de B2 (#1552) y F2 (#1553)

El botón «Subir un nuevo documento» permanece deshabilitado en esta entrada.
RequestStatusDetails conserva su callback para que F2 pueda conectarlo cuando corresponda.

B2 debe validar en el servidor su propia autorización para reemplazar el documento,
el estado rejected y las demás condiciones de escritura acordadas. No debe reutilizar
la coincidencia de correo ni el código público como autorización suficiente.

F1 no llama a endpoints de carga o reemplazo, no conserva una sesión de escritura y
no presenta la comprobación básica de correo como permiso para modificar documentos.

## Casos a comprobar

- Enlace con código: solo correo; ninguna consulta automática antes de continuar.
- Sin código, código mal formado o code repetido: aviso genérico y ningún formulario manual.
- Correo vacío o inválido: no consulta.
- Código y correo válidos: consulta B1 y muestra el rechazo con datos de la respuesta.
- Correo incorrecto, solicitud inexistente, errores y excepciones: mismo aviso genérico; reintento.
- Carga y doble envío: controles bloqueados y una sola consulta en curso.
- Respuesta de otra solicitud: no muestra sus datos.
- Cambio de enlace durante o después de consultar: no expone la respuesta anterior.
- Pendientes y aprobadas: conserva su detalle sin información de rechazo.

## Estado de aceptación

CA1–CA4: cubiertos por componentes y pruebas de F1, sujetos a ejecutar en el repositorio
actual y validar con B1 real. El diseño de escritorio se conserva.

CA5: el botón y su punto de integración existen; iniciar la carga depende de F2.
CA6–CA10: corresponden al flujo de corrección de B2/F2 y su validación T1.

Las pruebas anteriores, el build anterior y la revisión visual con datos ficticios no
sustituyen la ejecución del cambio actual ni la validación con backend real.
