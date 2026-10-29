# B2 — Reenvío del documento de una solicitud rechazada

Implementación de #1552 para la HU #1548. Complementa F1 (#1551); F2
(#1553) conectará la selección y confirmación del documento. La base revisada
es `b312e6b8b0b35588310074259c530057f3b36aaf` de la rama del equipo.

## Contrato HTTP

`POST /api/access-requests/:code/resubmit`

- `Authorization: Bearer <permiso-de-corrección>`.
- Cuerpo `multipart/form-data`: `file` y `documentType`.
- Tipos documentales: `academic_diploma` y `national_title`.
- Archivos y tamaño: las mismas reglas del módulo Files; máximo 10 MB,
  PDF, PNG o JPEG reconocidos por su contenido.
- Respuesta 200 mediante el interceptor existente:

```json
{
  "statusCode": 200,
  "ok": true,
  "detail": "Operación exitosa",
  "data": { "requestCode": "SOL-2026-0001", "status": "pending" }
}
```

Los archivos ausentes o inválidos producen 400; el límite HTTP, 413.
La autorización ausente o inválida responde 401 con el mismo mensaje para
solicitudes inexistentes y estados no admitidos. Una revisión que cambia
durante el envío o un conflicto con otra solicitud activa produce 409.
Los fallos internos utilizan el tratamiento global existente.

## Autorización y uso único

El código SOL y el correo utilizados por B1 permiten consultar. Por sí solos
no autorizan la sustitución de documentos. Un JWT de sesión tampoco se acepta
como permiso de corrección.

`DocumentCorrectionAuthorizationService.issueFor(accessRequestId)` es una API
interna exportada para B3. Solo emite un permiso para una solicitud rechazada.
No hay una ruta pública que permita obtenerlo con código y correo.

El permiso opaco se calcula con HMAC-SHA256, un propósito propio y la clave
de servidor `JWT_SECRET` existente. Se vincula al ID, código, documento actual
y revisión `updatedAt`. No contiene nombre, correo ni contenido documental;
su comparación utiliza `timingSafeEqual`. Es independiente de los JWT de
sesión y no hereda su caducidad.

Por la decisión de alcance acordada, **no tiene vencimiento por tiempo**:

- Abrir el enlace, cerrar la página, seleccionar o previsualizar un archivo
  no consume el permiso.
- La operación confirmada guarda el documento y cambia a `pending`; desde
  ese momento el permiso anterior ya no autoriza otro envío.
- Un fallo revierte la transacción y permite reintentar con el mismo permiso.
- Si cambia la revisión o el documento, o la solicitud deja de estar
  rechazada, el permiso anterior deja de ser válido.
- Un rechazo posterior requiere un permiso correspondiente a esa nueva
  revisión. No reactiva los enlaces del rechazo anterior.
- La rotación de la clave del servidor también invalida los permisos emitidos.

El enlace concede capacidad de corrección a quien posea el permiso. No se
debe registrar el token en logs, incluirlo en auditoría ni entregarlo mediante
la consulta pública de B1. Su entrega al destinatario corresponde a B3.

## Consistencia, historial y concurrencia

Una única transacción de Prisma:

1. Actualiza condicionalmente la misma solicitud `rejected` a `pending`,
   verificando ID, código, documento y revisión observados por el guard.
2. Guarda el archivo mediante FilesService y el mismo cliente transaccional.
3. Asocia el archivo nuevo, conserva ID, código y datos del solicitante y
   retira los campos de la revisión anterior de la fila actual.
4. Registra un evento real `document_replaced` y encola la validación existente.

Un segundo envío de la misma revisión no puede reservar de nuevo esa fila.
Si falla el archivo, su asociación, la auditoría o la cola, se revierte todo.
No se crea otra solicitud y no se elimina el archivo anterior.

El evento de reemplazo conserva como `evidenceFileId` el documento sustituido;
su referencia existente impide borrarlo y el detalle registra el ID del nuevo.
El documento nuevo queda asociado a la solicitud. En sucesivos reemplazos se
conserva la cadena de evidencias, incluso cuando una fila antigua no tenía
eventos previos. Los eventos de rechazo existentes se mantienen; no se fabrican
hechos históricos ni fechas anteriores.

FilesService y FilesRepository admiten un cliente transaccional opcional.
Las llamadas de carga inicial sin ese argumento conservan su comportamiento.
No se modifica el esquema Prisma ni se incluyen migraciones.

## Dependencias pendientes de integración

- **B3 (#1556):** debe llamar a la emisión interna después de confirmar el
  rechazo y entregar de forma privada el código y el permiso al destinatario.
  La base revisada usa MailServiceSender; `sendRejection(to, reason)` todavía
  dirige a `/request-access` y no transmite un permiso de corrección. B2 no
  cambia MailSender, sus contratos ni la plantilla de correo. Ese recorrido
  completo no funciona por añadir solamente este endpoint.
- **F2 (#1553):** debe recibir el permiso, enviarlo en Authorization únicamente
  al confirmar la corrección y manejar 200, 400, 401, 409, 413 y errores de red.
  La carga o vista previa no deben llamar al endpoint. F1 conserva el diseño
  aprobado y la consulta existente; este cambio no modifica su interfaz.
- **T1 (#1554):** debe validar el correo real, la entrada F1 y el reenvío F2/B2.
  La cola OCR se reutiliza; si se conecta un trabajador asíncrono, sus lecturas
  deben corresponder a la versión documental que se evalúa. No se afirma que
  las pruebas de doble reenvío validen ese trabajador externo.

## Verificación

Las nuevas pruebas unitarias y HTTP cubren autorización, vinculación a la
solicitud y revisión, ausencia de caducidad por reloj, formatos, tamaño,
presencia, tipos documentales, auditoría, reintentos y conflictos. Las pruebas
HTTP de la suite unitaria simulan la persistencia; no prueban PostgreSQL real.

Desde `backend`, ejecutar en el repositorio completo:

```bash
pnpm exec vitest run src/modules/access-requests/tests/document-correction src/modules/files/tests/files.transaction.spec.ts --maxWorkers=1
pnpm exec tsc -p tsconfig.build.json --noEmit
pnpm exec tsc --noEmit
pnpm run lint
pnpm run lint:standards
pnpm run build
pnpm run test:cov --maxWorkers=1
```

`test/document-correction.e2e-spec.ts` añade seis casos con PostgreSQL real:
persistencia, conservación del historial, fallos con rollback, doble envío,
rechazos sucesivos y permisos de otra solicitud. Por defecto quedan omitidos.
Habilitarlos únicamente con una `.env.test` que apunte a una instancia aislada:

```bash
RUN_B2_DB_TESTS=1 pnpm run test:e2e test/document-correction.e2e-spec.ts --maxWorkers=1
```

Antes de conectar, el test exige un `DB_NAME` con el segmento `test`. Esa
comprobación no sustituye verificar que se trata de una base aislada. Se usan
los catálogos existentes y se eliminan exclusivamente los datos creados por
cada ejecución. El test no migra, no ejecuta seeds, no vacía tablas y no envía
correos.

## Resultados de la verificación local — 28 de octubre de 2026

Las ejecuciones en el repositorio de trabajo dieron los siguientes resultados:

| Comprobación | Resultado |
|---|---|
| Pruebas nuevas unitarias y HTTP de B2 | 95 aprobadas en 8 archivos |
| Suite global con cobertura | 3315 aprobadas y 39 omitidas; 331 archivos aprobados y 3 omitidos |
| Tipado de producción (`tsconfig.build.json`) | Aprobado |
| Tipado general (`tsc --noEmit`) | No aprobado: 28 errores en 22 archivos de pruebas y scripts |
| `lint` | 0 errores; 7 advertencias fuera de los archivos de B2 |
| `lint:standards` | 0 errores; 5 advertencias en archivos generados de Prisma |
| `build` | Aprobado |
| PostgreSQL real: `document-correction.e2e-spec.ts` | 6 aprobadas en 1 archivo |

Las 95 pruebas nuevas están incluidas en la suite global; no se suman otra vez
al total de 3315. Las seis pruebas de PostgreSQL se ejecutaron por separado.

| Cobertura global | Resultado |
|---|---:|
| Statements | 92,72 % |
| Branches | 86,82 % |
| Functions | 91,39 % |
| Lines | 93,03 % |

Se supera el umbral global del 80 % en las cuatro métricas. La comprobación
adicional de la base `b312e6b8b0b35588310074259c530057f3b36aaf`, con las mismas
dependencias y el cliente Prisma generado del mismo esquema, reproduce los
28 diagnósticos de tipado general por archivo, ubicación y código TypeScript.
B2 no agrega diagnósticos a esa comprobación. El resultado general sigue
siendo fallido y debe comunicarse al equipo; no se cambió la configuración
para ocultar esos errores.

La validación real usó PostgreSQL 18 en el contenedor local `umssy-b2-test`,
la base exclusiva `umssy_b2_test`, el puerto de loopback `5433` y el esquema
`public`. Se aplicaron las 29 migraciones existentes y se cargaron catálogos;
no se creó una migración de B2. `.env.test` permanece fuera de Git.

En la base revisada, `buildDatabaseConnectionString` aplica `DB_SCHEMA` solo
para migraciones; PrismaService no selecciona ese esquema en runtime. Por
eso se utilizó una base separada con `DB_SCHEMA=public`, en lugar de asumir
que `DB_SCHEMA=test` aísla por sí solo las consultas. Este hallazgo debe
coordinarse con DevOps; B2 no modifica esa configuración compartida.

Las seis pruebas reales verificaron conservación del ID y código, retención
del documento anterior, rollback completo ante archivo inválido o fallo de
auditoría, reintento con el mismo permiso, un único reemplazo ante dos envíos
simultáneos, una nueva autorización tras otro rechazo y rechazo de permisos
de otra solicitud.

El log `simulated audit failure` corresponde a un fallo intencional de la
prueba de rollback. Se observaron avisos no bloqueantes de vite-tsconfig-paths
y pg; no se actualizaron dependencias ni configuraciones globales por esos
avisos. La validación integrada del correo B3, entrada F1 y corrección F2 sigue
pendiente de esas integraciones y de T1.
