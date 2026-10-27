# HU7: integración backend y frontend

Rama de integración: `feacture/epic-6-hu7-backend-and-frontend-integration`. Fecha: 26/10/2026.

## Alcance de la publicación

La rama publica código, migraciones de estructura, documentación y pruebas automatizadas. Las cuentas de demostración, bases PostgreSQL, scripts para preparar la demo, archivos de entorno y logs quedan exclusivamente en localhost, fuera del repositorio. El script de comprobación HTTP que crea una base temporal tampoco se publica; sus resultados se conservan como evidencia de la validación local. Los fixtures dentro de las pruebas automatizadas no cargan datos en la aplicación desplegada.

## Origen

La base es `dc51c4bb` de `feature/grupo-6-hu7-frontend-integracion`, que incluye las solicitudes y sanciones de HU7-2/HU7-4 y el backend de capacidad/ofertas. Se incorporó `9e1de927` de `feature/grupo-6-hu7-pausa-definitiva` como `0b11dda6`, resolviendo el registro conjunto de los controladores y repositorios. Antes de publicar se sincronizó `epic/grupo-6-red-mentorias` en `e7ac742a`, conservando sus validaciones, inserciones FIFO con reloj PostgreSQL, filtros de mentoría y modelos de auditoría. El cliente Prisma se regeneró desde el esquema combinado. Se conservaron las suites de pruebas de ambas ramas.

Los PR [#1452](https://github.com/UMSSY/umssy-app/pull/1452), [#1467](https://github.com/UMSSY/umssy-app/pull/1467), [#1476](https://github.com/UMSSY/umssy-app/pull/1476) y [#1478](https://github.com/UMSSY/umssy-app/pull/1478) describen las entregas visuales anteriores. Esta rama conecta el recorrido con la API existente y sustituye los controles y servicios de simulación. Especificación: [HU7 #1386](https://github.com/UMSSY/umssy-app/issues/1386) e [integración #1411](https://github.com/UMSSY/umssy-app/issues/1411).

## Contrato integrado

Todas las rutas llevan el prefijo `/api`, JWT y el sobre `{ statusCode, ok, detail, data }`.

| Operación | Ruta |
|---|---|
| Disponibilidad real | `GET /mentors/capacity` |
| Solicitar espera | `POST /mentor-participation/requests` |
| Consultar estado propio, oferta y correo | `GET /mentor-participation/requests/me` |
| Historial propio | `GET /mentor-participation/requests/me/history` |
| Corregir preferencias pendientes | `PATCH /mentor-participation/requests/me` |
| Cancelar solicitud pendiente | `DELETE /mentor-participation/requests/me` |
| Confirmar oferta | `POST /mentors/offers/:offerId/confirm` |
| Alta directa con cupo | `POST /mentors/activate` |
| Salida definitiva | `POST /mentors/me/leave` |

La consulta propia devuelve el último estado, incluidos `EXPIRED`, `CANCELLED` y `ENDED`, y la relación `offer` con ID, asignación y vencimiento persistidos. No devuelve el registro completo del usuario. Una solicitud cerrada no oculta una activación directa posterior.

El servidor reconcilia vencimientos/FIFO al consultar y al intentar solicitar. Los duplicados reciben `409` con `data.code=REQUEST_ALREADY_EXISTS`, conservando el ID y la fecha originales. Si se liberó capacidad al enviar, devuelve `409 CAPACITY_AVAILABLE` sin crear una espera; la interfaz solicita confirmar de nuevo el alta directa. No interpreta todos los conflictos 409 como autorización de activación.

## Recorrido

1. Completar el formulario y confirmar la intención de participar consulta disponibilidad real. Si no hay cupos, abre el modal FIFO sin registrar nada.
2. «Solicitar cupo» crea la solicitud. Cancelar/X/fondo/Escape no envían solicitudes; durante la operación se bloquean controles y cierre.
3. «Mi participación» muestra la solicitud persistida, el detalle, fecha, tiempo transcurrido, correo recortado y la advertencia de que no debe duplicarse. Se puede editar sin cambiar FIFO o cancelar con confirmación y resultado.
4. La consulta se actualiza cada 15 segundos y al recuperar foco. Una oferta sustituye la vista pendiente y muestra la fecha BOT y el contador absoluto sin reiniciarlo al reabrir.
5. Confirmar usa el ID real de la oferta. El cliente bloquea envíos repetidos y el backend resuelve la concurrencia. Tras el éxito se refrescan los roles y la participación activa.
6. Al vencer se bloquea la confirmación y se consulta de nuevo al servidor. El estado `EXPIRED` permite volver al formulario; una nueva espera recibe otro ID y turno. Si ahora hay cupos, se utiliza el alta directa.
7. «Pausar mentoría» confirma explícitamente la pérdida de rol y cupo. Las citas futuras impiden salir y se ofrece un enlace a la agenda. La disponibilidad reversible de Epic 7 conserva su operación independiente.

## Verificación reproducible

Se reutilizaron dependencias ya instaladas. Las pruebas PostgreSQL se ejecutan exclusivamente contra localhost y crean/eliminan sus propios esquemas; el smoke HTTP crea y elimina una base temporal propia. No requieren modificar la base de una demo existente.

Desde `frontend`:

```powershell
node node_modules/vitest/vitest.mjs run src/modules/mentors src/modules/mentorship --maxWorkers 2
node node_modules/typescript/bin/tsc --noEmit --incremental false
$env:NEXT_PUBLIC_APP_ENV='local'
$env:NEXT_PUBLIC_API_URL_LOCAL='http://127.0.0.1:8085/api'
node node_modules/next/dist/bin/next build --webpack
```

Desde `backend`, apuntando a una instancia local de pruebas:

```powershell
$env:HU7_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:5434/postgres'
node node_modules/typescript/bin/tsc -p tsconfig.build.json
node node_modules/vitest/vitest.mjs run src/modules/mentors --maxWorkers 2
```

Resultados automatizados: 239 pruebas frontend en 29 archivos y 216 pruebas backend en 19 archivos, incluidas 28 pruebas transaccionales PostgreSQL. El smoke HTTP pasó con JWT firmado y verificó autenticación, cupos, persistencia, duplicados, edición, cancelación, oferta FIFO, confirmación concurrente, expiración y activación directa posterior. TypeScript backend/frontend, la compilación de producción Next.js con webpack (41 páginas generadas) y el lint de los archivos frontend modificados pasaron. El lint backend no reportó errores; conserva dos advertencias previas de métodos sin enlazar en pruebas ajenas a estos cambios.

La comprobación HTTP citada se ejecutó localmente antes de excluir su script de esta publicación. Esta evidencia es automatizada y no sustituye una revisión visual de todos los mockups en escritorio y móvil. El envío de correos no forma parte de ese smoke HTTP. La publicación conserva la migración estructural del control de intentos; no incorpora datos de demostración ni ejecuta un despliegue.

Tras sincronizar con la épica se repitieron TypeScript backend/frontend y las regresiones: 243 pruebas backend aprobadas en 21 archivos, incluidos los escenarios transaccionales PostgreSQL, y 261 pruebas frontend aprobadas en 32 archivos. Las pruebas crean únicamente sus propios esquemas temporales y no modifican la base de la demo.
