# B3 — Correo de rechazo y enlace a Mi solicitud

Implementación de #1556 para la HU #1548. Parte de B2 en
`f55504423a4610418217e6fa506791edbe787f9c` y prepara la entrega del enlace
consumido por F1 y F2. La integración de B2 sigue siendo una dependencia
del PR de B3 mientras no esté fusionada en la rama del equipo.

## Flujo

1. El flujo existente registra el rechazo y llama a
   `RejectionNotificationService.notify(email, reason, accessRequestId)`.
2. La notificación propaga internamente ese ID mediante AsyncLocalStorage.
   Se conserva la llamada `MailSender.sendRejection(email, reason)` y su
   firma de dos parámetros; no se busca la última solicitud por correo.
3. El servicio de enlace consulta por el ID exacto y comprueba el correo,
   el motivo y la revisión almacenados. Solo obtiene esos campos privados.
4. B2 emite el permiso por su API interna y vuelve a comprobarse que
   corresponde a la misma solicitud y revisión. Un cambio detectado impide
   enviar un enlace asociado al motivo anterior.
5. El adaptador renderiza el archivo MJML mediante el MailService compartido
   y envía HTML y texto plano por el transporte ya configurado.

La selección del documento y el envío de su corrección siguen siendo
responsabilidad de F2 y B2. Este cambio no añade un endpoint de emisión,
OTP, vencimiento temporal, tablas ni migraciones.

## Enlace

```text
/request-access/status?code=SOL-2026-0001#correctionToken=<permiso-de-B2>
```

- El código se entrega en `code`; el correo no se incluye en la URL.
- El permiso va únicamente en el fragmento `correctionToken`.
- La URL usa el helper existente: FRONTEND_URL o el primer CORS_ORIGIN,
  con el valor local predeterminado del proyecto.
- Se rechazan protocolos distintos de HTTP/HTTPS y URLs con credenciales.
- El frontend solicita el correo registrado mediante F1. Esa coincidencia
  permite la consulta y no reemplaza la autorización de escritura de B2.
- Enviar o abrir el correo no consume el permiso. El reemplazo confirmado
  y el cambio de revisión lo invalidan conforme a B2; un rechazo posterior
  necesita otro enlace. No se incorpora expiración por tiempo.

## Plantilla e infraestructura

La plantilla está en
`src/modules/mail/mjml/access-request-rejection.mjml`. Se carga desde el
adaptador de solicitudes y reutiliza layout.mjml, header.mjml y las clases
visuales del módulo mail. Muestra estado, código, motivo y el botón
«Mi solicitud», con una explicación de la verificación por correo.

MailTemplateService conserva el renderizado MJML estricto y el escape de
valores dinámicos. El motivo se introduce como texto; el contenido recibido
no se interpreta como HTML ni como una segunda plantilla.

El mecanismo existente `scripts/copy-mail-templates.ts` copia el directorio
mail/mjml de forma recursiva. Por ello incorpora el nuevo archivo al backend
compilado sin cambiar el script de build ni duplicar la plantilla HTML.

Se conserva el servicio compartido y su transporter. Los métodos de código
de activación y cuenta activada mantienen sus cuerpos y enlaces existentes.
No se modifican MailSender, MailService, MailTemplateService ni Prisma.

## Fallos y concurrencia

AsyncLocalStorage aísla el ID por ejecución asíncrona, incluso si se notifican
dos solicitudes de un mismo correo simultáneamente. No se utiliza un ID
mutable global ni se deduce la solicitud a partir del destinatario.

Los fallos al cargar la plantilla, leer los datos, preparar el permiso o
entregar el correo se capturan en la notificación y devuelven false. El
rechazo ya registrado no se revierte. El registro de errores incluye el ID
de la solicitud y un mensaje fijo, sin volcar la excepción del transporte,
que podría contener destinatario, motivo o enlace.

No es posible hacer atómico un cambio posterior de la solicitud y una
entrega SMTP externa. Un correo que llegue después de otro cambio puede
contener un permiso antiguo; B2 vuelve a verificar el estado y la revisión
al usarlo. La comprobación previa no sustituye esa autorización final.

El transporte de consola del módulo compartido conserva su comportamiento
local y registra el texto del correo, incluido el enlace de prueba. Esos
registros deben tratarse como datos privados. No se añade ese registro a
las entregas SMTP de producción.

## Verificación

Se añadieron pruebas de enlace, contexto asíncrono, consulta mínima, servicio
de enlace, plantilla MJML y notificación integrada con transporte simulado.
La integración usa el emisor y verificador reales de B2 con lecturas de
repositorio simuladas; no acredita persistencia PostgreSQL ni una entrega
real de correo.

Resultados locales revisados:

- Pruebas específicas de correo, rechazo y autorización: 121 aprobadas en
  10 archivos, con renderizado MJML real y transporte simulado.
- Se añadieron 48 pruebas de B3 en seis archivos, incluidas en esos totales.
- Suite global con cobertura: 3363 aprobadas y 39 omitidas; 337 archivos
  aprobados y tres omitidos. Las omisiones corresponden a integraciones de
  mentorías existentes; B3 no añade omisiones.
- Lint principal: cero errores y siete advertencias conocidas en archivos
  ajenos a los cambios de B3. Se corrigieron las advertencias nuevas de la
  prueba de integración sin desactivar reglas.
- Lint de estándares: cero errores y cinco advertencias en archivos
  generados de Prisma.
- Build y tipado de producción: aprobados.
- Carga de la plantilla desde el adaptador JavaScript de dist: aprobada.
- Comprobaciones de espacios: aprobadas.

| Cobertura global del backend | Resultado |
| --- | ---: |
| Statements | 92,77 % |
| Branches | 86,90 % |
| Functions | 91,44 % |
| Lines | 93,08 % |

El tipado general no está aprobado: conserva 28 diagnósticos en 22 archivos
existentes de pruebas y scripts. Tras corregir los tres errores de tipado
nuevos en los mocks de B3, los diagnósticos restantes coinciden por archivo
y código con el registro de la base previamente comprobada en B2. La
comparación no equipara números de línea, porque los imports y el montaje
de las pruebas existentes se desplazaron. No se presenta como una nueva
compilación de una copia de la base ni como aprobación del tipado general.

La cobertura global se ejecutó antes del último ajuste de los mocks de la
prueba de integración. Ese ajuste afecta únicamente a la preparación de
los dobles de prueba; no cambia producción ni desactiva tipos o reglas.
Después se repitieron las siete pruebas de integración, que pasaron, el
linter y el tipado general. Los totales de las ejecuciones se solapan y no
se suman entre sí.

Comandos de verificación utilizados desde backend:

```bash
pnpm run lint
pnpm run lint:standards
pnpm run build
pnpm exec vitest run src/modules/access-requests/tests/rejection src/modules/access-requests/tests/mail-service-sender.spec.ts src/modules/access-requests/tests/access-requests.reject.spec.ts src/modules/access-requests/tests/document-correction-authorization.spec.ts src/modules/mail/tests --maxWorkers=1
pnpm exec tsc --noEmit
pnpm run test:cov --maxWorkers=1
```

La comprobación adicional importó loadRejectionTemplate desde
`dist/modules/access-requests/mail/templates/access-request-mails.template.js`
y confirmó que puede leer el archivo copiado en dist con el contenido de
rechazo esperado. No invocó SMTP.

Las 24 pruebas nativas de preparación y el análisis de sintaxis realizados
fuera del repositorio completo fueron comprobaciones complementarias; no
se incluyen en los totales Vitest del proyecto.

## Pendientes de integración

- Fusionar B2 y revisar que la comparación del PR de B3 muestre su alcance.
- Revisar el contenido final del PR y las dependencias antes de integrar.
- Validar con T1 el correo, la consulta F1, la corrección F2 y B2 juntos,
  incluyendo un enlace antiguo después de cambiar el estado o la revisión.
- La entrega SMTP real necesita un entorno autorizado y su configuración;
  las pruebas automatizadas no realizan envíos ni usan credenciales reales.

Refs #1556
Refs #1548
