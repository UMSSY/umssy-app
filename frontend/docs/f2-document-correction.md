# F2 — Carga y reenvío del documento corregido

Implementación de #1553 para la HU #1548, sobre la pantalla de F1 (#1551).
Se reutiliza el contrato de B2 (#1552). El diseño de rechazo y sus
recomendaciones compartidas permanecen en RequestStatusDetails.

## Flujo

1. La persona abre el enlace del correo y escribe únicamente el correo
   registrado, como en F1.
2. B1 permite mostrar el rechazo. Si el enlace incluye un permiso de
   corrección con formato admitido, se habilita «Subir un nuevo documento».
3. La selección y la vista previa son locales. Se puede quitar el archivo,
   elegir otro o cancelar, conservando el documento almacenado.
4. «Enviar documento» valida archivo y tipo, bloquea los controles y hace
   una única petición a B2.
5. Solo una respuesta válida de la misma solicitud en `pending` confirma el
   envío. Se muestra la confirmación y el estado pendiente de revisión.

La autorización efectiva se verifica exclusivamente en B2. El formato del
permiso en el navegador no demuestra identidad ni reemplaza esa comprobación.
Conocer el código y el correo de B1 no habilita escrituras.

## Entrega del permiso por B3

F2 queda preparada para este enlace:

```text
/request-access/status?code=SOL-2026-0001#correctionToken=<permiso>
```

- El código SOL sigue en `code`, según el contrato de F1.
- El permiso de B2 se entrega en el fragmento `correctionToken`, con formato
  `dcr1.` y su firma opaca. No es un JWT de sesión.
- El fragmento se lee solo en el navegador; no se serializa en el HTML
  generado en servidor. No se admite tomar el permiso desde el query string.
- Los valores vacíos, inválidos o repetidos no habilitan la corrección.
- El permiso y el archivo no se guardan en localStorage, sessionStorage ni
  otros almacenes persistentes del navegador.
- El fragmento se conserva al seleccionar, cancelar o fallar el envío para
  permitir reabrir el enlace y reintentar. No se añade vencimiento temporal.
- Se retira el permiso del enlace actual después del éxito confirmado por B2.
  La invalidación real del permiso corresponde al servidor.

B3 debe generar y entregar ese enlace utilizando el permiso emitido por B2.
Este cambio no modifica MailSender ni publica un endpoint de emisión. Un
correo antiguo que solo trae el código permite la consulta de F1 y mantiene
la corrección deshabilitada hasta recibir un permiso por el canal previsto.

## Reutilización

- DocumentDropzoneContent contiene la zona visual de selección compartida.
- DocumentPreviewContent contiene la vista previa y el control para quitar
  el archivo, incluyendo PDF sin MIME cuando la extensión es admitida.
- DocumentTypeField comparte el selector y su catálogo de opciones.
- DocumentDropzone y DocumentPreviewCard siguen siendo adaptadores del
  contexto inicial: conservan la subida al seleccionar y el borrado del
  documento de borrador en ese flujo.
- DocumentCorrectionForm utiliza esos mismos componentes con acciones
  locales. Su hook solo llama al servidor al confirmar el envío.
- Se conserva validateDocumentFile como fuente de las reglas de formato,
  tamaño y archivo vacío. El servidor conserva la validación por contenido.

## Contrato HTTP

El servicio del módulo utiliza el apiClient existente:

```text
POST /api/access-requests/:code/resubmit
Authorization: Bearer <permiso-de-corrección>
multipart/form-data: file, documentType
```

No se fija manualmente Content-Type, para que el navegador genere el boundary.
La autorización explícita conserva el permiso de corrección frente al token
de sesión que pueda existir en el cliente compartido.

La confirmación exige el mismo `requestCode` y `status: pending`. Una
respuesta incorrecta, de otra solicitud o un envelope fallido no confirma
el envío. Se devuelven solo esos campos; no se propagan datos personales ni
mensajes internos de errores a la interfaz.

Los errores de archivo, autorización, conflicto, límite de tamaño, red y
servidor permiten conservar la selección para reintentar. Un 401 indica que
se debe volver al enlace de revisión; no se presenta como vencimiento por
tiempo ni se introduce un nuevo OTP.

Las refs bloquean confirmaciones simultáneas antes del primer await. Las
URLs de vista previa se revocan al quitar, cancelar, finalizar o desmontar.
Un cambio de código o permiso descarta la selección anterior; una respuesta
tardía del formulario desmontado no actualiza la nueva vista.

## Validación

Se añadieron pruebas de utilidades, servicio HTTP, estado de corrección,
lectura del fragmento y recorrido desde MyRequestView. Cubren selección,
vista previa, cancelación, reemplazo local, archivo inválido o ausente,
permisos inválidos, errores, progreso, reintentos, doble confirmación,
respuesta tardía y confirmación en pendiente.

Resultados ejecutados en el repositorio local completo:

- Lint del módulo: aprobado, sin errores ni advertencias.
- `pnpm exec tsc --noEmit`: aprobado.
- `pnpm run build`: aprobado; se generaron 53 páginas estáticas.
- Pruebas específicas iniciales: 206 aprobadas en 11 archivos.
- Módulo completo y ruta de estado con cobertura: 613 pruebas aprobadas en
  43 archivos, sin reducir los umbrales del proyecto.

| Cobertura del módulo access-request | Resultado |
| --- | ---: |
| Statements | 95,42 % |
| Branches | 89,09 % |
| Functions | 95,10 % |
| Lines | 96,90 % |

Esta cobertura corresponde exclusivamente al módulo access-request. Las
pruebas de la ruta se ejecutaron en la misma comprobación; sus archivos no
se incluyeron en el alcance de medición de cobertura. Los totales de las
ejecuciones específicas se solapan y no se suman al total de 613 pruebas.

Comando utilizado:

```bash
pnpm exec vitest run src/modules/access-request 'src/app/(public)/request-access/status' --coverage --coverage.include='src/modules/access-request/**' --maxWorkers=1 --testTimeout=15000
```

La suite global todavía no está aprobada. La primera ejecución con cobertura
registró 4278 pruebas aprobadas y 6 fallidas en 4 archivos. Los cuatro archivos
pasaron después sin cobertura, con 65 pruebas y sin cambios de código ni de
sus límites de tiempo. Una segunda ejecución global con `--testTimeout=15000`
registró 4283 pruebas aprobadas y una fallida, en
`src/modules/availability/views/blocked-dates-flow.test.tsx:72`, al esperar
el botón «Seleccionar fecha: Jueves 8 de octubre» mediante `findAllByRole`.
Ese archivo no se modifica en F2. La causa y su reproducción en la base
siguen pendientes; no se afirma que sea un fallo heredado demostrado.
No se obtuvo un resumen de cobertura global en esas ejecuciones fallidas.
El límite por prueba no modifica por sí solo la espera de las consultas de
Testing Library. No se cambiaron la configuración de CI ni los umbrales.

Las pruebas de frontend utilizan servicios simulados. El responsable confirmó
la comprobación visual manual del flujo de F2 con una API local simulada.
Esta comprobación no acredita integración con B2 ni envío de correos reales.
El recorrido real entre frontend, B2 y correo B3 sigue pendiente de integración.

## Base de trabajo y dependencias

La base de F2 es F1 en `f62ef5d0080061780682c917b97b3db04f173185`, para
conservar la pantalla aprobada. Mientras F1 siga sin fusionarse, la rama de
F2 incluye sus commits por ascendencia. Antes de abrir el PR hacia la rama
epic del equipo, revisar que la integración de F1 deje únicamente los cambios
propios de F2 en la comparación.

B2 en el PR #1784 define el endpoint y la autorización. Si aún no se fusionó,
el backend de la rama base de F1 no contiene esa ruta. La verificación real
debe ejecutarse contra el backend de B2 o la rama del equipo que ya lo incluya.
Las pruebas de frontend con servicios simulados no acreditan ese recorrido.

Quedan como dependencias de integración la entrega real de B3 (#1556) y la
validación T1 (#1554) con el correo, F1, F2 y B2 juntos. F2 no cambia el
esquema Prisma, migraciones, el backend ni el diseño del correo.
