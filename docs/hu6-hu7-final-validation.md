# Corrección final y validación HU-MEN-06 / HU-MEN-07

Fecha: 28/10/2026, America/La_Paz. Alcance: integración de participación,
incorporación directa, FIFO, ofertas, intentos y salida. Sin envío real de correo.

## A. Estado de Git y fuentes

- Rama conservada: `fix/grupo-6-hu6-hu7-regresion`.
- SHA inicial y remoto al iniciar: `f072d48416559d5b056216fbcabf7a0113468d8f`.
- Referencias remotas obtenidas antes de editar: develop
  `8f1abc4a8ba1c6941f071695bb0eb2fed695bb28`; Epic6
  `b5ff8124a12f29b168e064cb0800f742289695c3`.
- No había cambios locales ni commits adicionales en la rama remota. Se mantuvo
  el trabajo publicado; no hubo rebase de commits publicados, force push ni reset.
- El destino correcto del primer PR es `epic/grupo-6-red-mentorias`. El líder
  gestiona posteriormente Epic6 → develop. No se creó un PR directo a develop.
- Commits de código adicionales: `680e7c6585524f5f497d3c9cde38fcfe0e2a612d`
  (invariante H1, validación y política backend) y
  `e753e3b66e8fa0921ef9e01d8754eeef8522a1f9` (reutilización, persistencia y UI).
  Ajustes visuales posteriores:
  `b2c86f51b4eed16490233c86439198c22e4e11ef` (responsive y contraste).
  La entrega informa además el SHA del commit de documentación, que es posterior
  a los dos anteriores. No se creó PR.
- Al inicio, `origin/develop...HEAD` tenía 0 commits exclusivos de develop y 1
  exclusivo de esta rama; frente a Epic6, 1 y 1 respectivamente. Los commits
  nuevos se agregan sobre esa base; no se mezcló una rama histórica de HU7.
  Con el commit documental de esta entrega, los conteos quedan 0/5 frente a
  develop y 1/5 frente a Epic6, usando las referencias registradas arriba.

Archivos afectados: controllers de activación y participación; repositories de
ambos flujos y nuevo repository de intentos; servicios de ambos flujos y nueva
política de intentos; nuevo schema de cabecera y tres tipos backend; cinco
archivos de pruebas backend. En frontend: ambos servicios HTTP, las dos vistas y
sus pruebas; utilidad y prueba trasladadas a shared con sus cuatro tipos; tres
adaptadores de persistencia y pruebas del wrapper IndexedDB; overview y los dos
modales de participación ajustados a pantallas estrechas. Se agregan este
informe, la revisión Database y el borrador SQL, y se referencia la revisión nueva
desde el informe histórico. El listado exacto es reproducible con
`git diff --name-status f072d48416559d5b056216fbcabf7a0113468d8f HEAD`.

Fuentes consultadas: especificación general de proyecto (23 páginas; las tres
copias proporcionadas tienen SHA256 idéntico), `PR-REVIEW-PROMPT-TEMP.md`,
`.github/CODEOWNERS`, documentación vigente y `hu6-hu7-regresion.md`.
El prompt de revisión estática se usó como referencia de estándares; la misión
correctiva autoriza implementación y pruebas. No se aplicó su exclusión de tests
para impedir las validaciones solicitadas por el encargo actual.

Se volvieron a consultar las issues [#1386](https://github.com/UMSSY/umssy-app/issues/1386),
[#1436](https://github.com/UMSSY/umssy-app/issues/1436),
[#1437](https://github.com/UMSSY/umssy-app/issues/1437),
[#1438](https://github.com/UMSSY/umssy-app/issues/1438),
[#1439](https://github.com/UMSSY/umssy-app/issues/1439),
[#1440](https://github.com/UMSSY/umssy-app/issues/1440),
[#1540](https://github.com/UMSSY/umssy-app/issues/1540),
[#1542](https://github.com/UMSSY/umssy-app/issues/1542) y
[#1545](https://github.com/UMSSY/umssy-app/issues/1545).

## B. Inspección inicial y correcciones

La inspección de H1–H5 se completó antes de editar producción. La tabla inicial
se presentó al solicitante antes de aplicar cambios.

| Hallazgo                                | Evidencia inicial                                                                                                                                                                         | Cambio realizado                                                                                                                                                                                                                                                   | Prueba / riesgo residual                                                                                                                                                                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1: rol y reserva propios simultáneos   | `MentorsRepository.activate()` conciliaba, comprobaba elegibilidad/capacidad y creaba rol, sin consultar solicitudes/ofertas propias. La prueba roja obtuvo 201 donde debía rechazar 409. | Consulta ambas condiciones dentro de la misma transacción y advisory lock, después de conciliación y elegibilidad, antes de capacidad/escrituras. Devuelve el motivo sin modificar la reserva; el servicio lanza el error de dominio y orienta a Mi participación. | Casos PostgreSQL/HTTP en ambos esquemas; carrera confirmar/activar, último cupo, oferta sin solicitud, cola no asignable, idempotencia y estados cerrados. No se reparan silenciosamente datos históricos incompatibles del servidor.               |
| H2: import privado entre dominios       | `mentors/services/mentor-participation.service.ts` importaba `mentorship/services/mentor-intake-idempotency`.                                                                             | Una implementación transversal en `shared/services/mentor-intake-idempotency.ts`; contratos en `shared/types/`. Ambos dominios la consumen. No se agregó lógica a barrels ni se crearon implementaciones paralelas.                                                | Tests de UUID, recarga, separación usuario/operación, timeout/500 y fallo de persistencia. Además, dos pestañas reales enviaron la solicitud concurrentemente: una solicitud PENDING, un intento REQUEST y una clave persistida, sin rol de mentor. |
| H3: controllers dependían de repository | Ambos controllers importaban el parser desde `repositories/mentor-intake-policy.ts`. Ese archivo mezclaba SQL y política.                                                                 | Parser único Zod en `requests/mentor-idempotency-key.schema.ts`. Coordinación en `services/mentor-intake.service.ts`; consultas, bloqueo y persistencia en un repository compartido por los dos repositories existentes.                                           | Cabecera ausente, vacía, inválida y UUID reservados en ambos POST: 400 institucional sin intentos. Se conserva normalización a minúsculas. No se agregó un módulo Nest innecesario.                                                                 |
| H4: auditoría/modelos                   | Falta auditoría en modelos Prisma y base nueva; índices FK y catálogos difieren del estándar y entre los dos esquemas.                                                                    | Auditoría y propuesta SQL separadas en `mentor-intake-database-review.md` y `mentor-intake-audit-proposal.sql`. No se modificó Prisma ni una migración adicional.                                                                                                  | **Bloqueado por Database/DevOps** para incorporar el ajuste protegido. No se presenta el borrador como ejecutado.                                                                                                                                   |
| H5: comentarios nuevos en inglés        | Política de intentos, storage compartido y explicación de reincorporación.                                                                                                                | Comentarios útiles traducidos; la política se separó por responsabilidad. No se hizo un barrido de comentarios históricos ni de código generado.                                                                                                                   | Comentarios de la migración publicada se conservan: modificarlos requiere el procedimiento Database, sin reescribir historial aplicado.                                                                                                             |
| Reutilización de persistencia           | La rama tenía acceso nativo IndexedDB pese a existir `createIndexedDbStorage()` con `idb`.                                                                                                | Se reutiliza el wrapper existente, agregando actualización atómica y espera de commit. `browser-indexed-db.ts` conserva su contrato público y base/store existentes.                                                                                               | Las pruebas cubren commit, error, cancelación y lectura/escritura dentro de una transacción.                                                                                                                                                        |
| Reutilización de notificaciones         | La vista reconstruía un aviso de éxito con temporizador y botón propio.                                                                                                                   | Usa Sonner con duración de cuatro segundos y cierre habilitado. Se conserva el mensaje de éxito, sin cambiar el diseño institucional.                                                                                                                              | Prueba de integración del componente y opciones del toast.                                                                                                                                                                                          |
| Desbordamiento móvil comprobado         | En navegador real, la pantalla activa medía 379 px para un viewport de 320 px. Los modales también desbordaban: salida 361 px y reincorporación 370 px de contenido.                      | Overview con wrap y `cn`; modales con ancho acotado, columna de ancho mínimo cero, contenido envolvente y acciones verticales en móvil. El desplazamiento vertical conserva acciones accesibles por teclado.                                                       | Ajuste visual posterior a la suite global frontend; 18 tests de vista/modal, ESLint, build y navegador. No cambia reglas ni contratos.                                                                                                              |
| Contraste del botón de reincorporación  | Texto `rgb(11,31,46)` sobre `rgb(0,55,112)`: contraste calculado 1,42:1. La clase local anulaba el texto del botón predeterminado.                                                        | Se elimina esa personalización y se reutilizan los colores del Button predeterminado, sin inventar colores nuevos.                                                                                                                                                 | Después del build, el navegador devuelve texto `rgb(255,255,255)` sobre `rgb(0,55,112)`: **11,79:1** según la fórmula de luminancia relativa. No equivale a una certificación WCAG completa.                                                        |

### Evidencia roja H1

Antes de la corrección, los casos nuevos H1 ejecutados con PostgreSQL real
produjeron **10 fallos y 6 aprobaciones**: activación indebida con oferta propia,
solicitud conciliada, pendiente no asignable, reserva histórica sin solicitud y
carrera con confirmación. Los demás casos del archivo se filtraron solamente en
esa reproducción; no se contabilizan como omitidos aceptados de la validación final.

El invariante nuevo no elimina solicitudes, no vence anticipadamente ofertas,
no cambia `queuedAt` ni preferencias y no altera el 40 %. La conciliación puede
producir una transición legítima PENDING → OFFERED antes del rechazo. Una oferta
existente conserva ID, `offeredAt` y `expiresAt`. El rechazo se registra/reproduce
como una intención de negocio dentro de la política idempotente vigente.

### Archivos y líneas

Referencias de esta revisión (las líneas corresponden al código de la rama):

| Hallazgo | Archivo y línea                                                                                                                             | Prueba relacionada                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| H1       | `backend/src/modules/mentors/repositories/mentors.repository.ts:488` y `services/mentors.service.ts:307` dentro del mismo módulo            | `mentor-regression-http.integration.spec.ts`: solicitud, oferta, reserva histórica, repetición y carreras, en ambos esquemas. |
| H2       | `frontend/src/shared/services/mentor-intake-idempotency.ts:65`; actualización atómica en `shared/services/storage/indexed-db-storage.ts:52` | `mentor-intake-idempotency.test.ts` e `indexed-db-storage.test.ts`.                                                           |
| H3       | `backend/src/modules/mentors/requests/mentor-idempotency-key.schema.ts:14`; coordinación en `services/mentor-intake.service.ts:28`          | `mentor-idempotency-key.spec.ts` y contratos HTTP de ambos POST.                                                              |
| H4       | `docs/mentor-intake-database-review.md:1` y `docs/mentor-intake-audit-proposal.sql:1`                                                       | Despliegue real de las migraciones vigentes sobre dos bases locales; el borrador nuevo no se ejecutó.                         |
| H5       | `backend/src/modules/mentors/services/mentor-intake.service.ts:78` y `frontend/src/shared/services/storage/indexed-db-storage.ts:57`        | Revisión del diff; migraciones históricas preservadas.                                                                        |

La vista orienta al usuario en
`frontend/src/modules/mentorship/views/mentorship-view.tsx:401`. La reutilización
de Sonner se encuentra en `frontend/src/modules/mentors/views/participation-view.tsx:74`.

## C. Estado de aceptación HU7

Las categorías siguientes describen evidencia **local**, no el despliegue oficial.
“Implementado y probado” exige una prueba ejecutada; la inspección de código no
se utiliza por sí sola para otorgar esa clasificación.

| CA #1386 | Comportamiento                                    | Clasificación / evidencia                                                                                                                                           |
| -------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | Confirmar e incorporar una sola vez               | Implementado y probado: integración PostgreSQL y carrera H1.                                                                                                        |
| 2        | Contador disminuye                                | Implementado y probado: componente con reloj controlado.                                                                                                            |
| 3        | Reapertura conserva fecha absoluta                | Implementado y probado: componente de oferta.                                                                                                                       |
| 4        | Cancelar modal no envía solicitud                 | Implementado y probado: diálogos/wizard.                                                                                                                            |
| 5        | Carga bloquea botones                             | Implementado y probado: interacción de confirmación.                                                                                                                |
| 6        | Bloquear cierre durante envío                     | Implementado y probado: diálogos y Escape.                                                                                                                          |
| 7        | Elegibilidad y formulario                         | Implementado y probado: JWT/sesión y PostgreSQL; sin vínculo no basta el correo.                                                                                    |
| 8        | Recalcular cupos al enviar                        | Implementado y probado: consultas dentro del bloqueo y casos de competencia.                                                                                        |
| 9        | Rechazar duplicados sin mover turno               | Implementado y probado: PostgreSQL/HTTP e idempotencia.                                                                                                             |
| 10       | Guardar usuario, fecha y estado inicial           | Implementado y probado: persistencia PostgreSQL.                                                                                                                    |
| 11       | Impedir otra solicitud pendiente                  | Implementado y probado: claves repetidas y nuevas.                                                                                                                  |
| 12       | Estado, fecha y tiempo transcurrido               | Implementado y probado: componente pendiente.                                                                                                                       |
| 13       | Reabrir recalcula tiempo sin cambiar fecha        | Implementado y probado: componente/fechas persistidas.                                                                                                              |
| 14       | Correo y truncado                                 | Implementado y probado en DOM; verificación visual completa pendiente. Envío real excluido expresamente.                                                            |
| 15       | Navegar a Mi participación                        | Implementado y probado: wizard, vista y conflictos de incorporación.                                                                                                |
| 16       | Consultar/cerrar detalles sin cambios             | Implementado y probado: componente pendiente.                                                                                                                       |
| 17       | Confirmar cancelación y advertir pérdida de lugar | Implementado y probado: diálogo.                                                                                                                                    |
| 18       | Cancelar y mostrar éxito                          | Implementado y probado: PostgreSQL y componente.                                                                                                                    |
| 19       | Retirar cancelada sin alterar orden relativo      | Implementado y probado: integración FIFO.                                                                                                                           |
| 20       | Oferta sustituye espera                           | Implementado y probado: componente y contrato HTTP.                                                                                                                 |
| 21       | Plazo real de 24h y Bolivia                       | Implementado y probado: duración SQL y formato absoluto del componente.                                                                                             |
| 22       | Vencer con pantalla abierta                       | Implementado y probado: reloj del componente deshabilita confirmar.                                                                                                 |
| 23       | Reingreso tras vencer                             | Implementado y probado: estado EXPIRED, historial y nueva solicitud.                                                                                                |
| 24       | Consultar cupos y opción de incorporación         | Implementado y probado: capacidad, wizard y API.                                                                                                                    |
| 25       | Fondo cierra sin solicitar                        | Implementado y probado: diálogo.                                                                                                                                    |
| 26       | Desenfoque del fondo                              | Implementado y probado localmente: desenfoque observado en navegador en detalles de solicitud y modales de participación. No se certifica solamente por clases CSS. |
| 27       | Restaurar interacción al cerrar                   | Implementado y probado en componentes y navegador: Volver/Escape cierran; Escape devuelve foco al disparador y permite seguir interactuando.                        |
| 28       | Ejecutar algoritmo al liberar cupo                | Implementado y probado: salida/expiración y rollback de reasignación.                                                                                               |
| 29       | Un usuario por cupo                               | Implementado y probado: dos pools/instancias y evento único.                                                                                                        |
| 30       | Confirmación simultánea                           | Implementado y probado: PostgreSQL y carrera con alta directa.                                                                                                      |
| 31       | Expirar sin visitas                               | Implementado y probado: worker y conciliación; ejecución oficial bloqueada por infraestructura/acceso.                                                              |
| 32       | Expirar y reasignar con 24h nuevas                | Implementado y probado: integración FIFO/ofertas.                                                                                                                   |
| 33       | Repostulación nueva al final                      | Implementado y probado: nuevo ID/fecha y conservación del historial.                                                                                                |

| Subtarea / criterio                                             | Clasificación / evidencia                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| #1436.1: titulado elegible                                      | Implementado y probado: vínculo aprobado y rol activo en PostgreSQL.                                                      |
| #1436.2: rechazo controlado sin solicitud                       | Implementado y probado: HTTP, sin insertar participación. Los rechazos de negocio sí registran un intento conforme #1439. |
| #1436.3: floor(40 %)                                            | Implementado y probado: 0, 1, 2, 3, 5, 9, 10 y 25 graduados en SQL y unidad.                                              |
| #1436.4: reservas vigentes                                      | Implementado y probado: conteo y rechazo H1.                                                                              |
| #1436.5: revalidar servidor                                     | Implementado y probado: transacción, no depende del dato del frontend.                                                    |
| #1436.6: último cupo concurrente                                | Implementado y probado: dos usuarios y dos intenciones del mismo usuario.                                                 |
| #1437.1: PENDING persistido                                     | Implementado y probado: PostgreSQL.                                                                                       |
| #1437.2: duplicado conserva turno                               | Implementado y probado: PostgreSQL y reintentos.                                                                          |
| #1437.3: consultar datos propios                                | Implementado y probado: JWT real y aislamiento por usuario.                                                               |
| #1437.4: editar no mueve turno                                  | Implementado y probado: integración FIFO.                                                                                 |
| #1437.5: cancelar conserva historial                            | Implementado y probado: integración.                                                                                      |
| #1437.6: conservar orden posterior                              | Implementado y probado: integración FIFO.                                                                                 |
| #1438.1: una oferta por cupo                                    | Implementado y probado: dos pools.                                                                                        |
| #1438.2: elegir primero FIFO                                    | Implementado y probado: `queuedAt,id` y elegibilidad.                                                                     |
| #1438.3: plazo de 24h                                           | Implementado y probado: fechas persistidas.                                                                               |
| #1438.4: confirmación válida única                              | Implementado y probado: transacción y concurrencia.                                                                       |
| #1438.5: vencida no confirma                                    | Implementado y probado: integración/contrato.                                                                             |
| #1438.6: worker sin visitas                                     | Implementado y probado localmente; ejecución oficial bloqueada por infraestructura.                                       |
| #1438.7: reingreso al final                                     | Implementado y probado: oferta vencida, nuevo registro.                                                                   |
| #1439.1: cuatro intentos                                        | Implementado y probado: ventana móvil compartida.                                                                         |
| #1439.2: quinto 429/72h                                         | Implementado y probado: PostgreSQL/HTTP y Retry-After.                                                                    |
| #1439.3: clave repetida no suma                                 | Implementado y probado: persistencia y reinicio de servicio.                                                              |
| #1439.4: sexto no renueva                                       | Implementado y probado: sanción y evento únicos.                                                                          |
| #1439.5: consultas/edición/cancelación/falla técnica no cuentan | Implementado y probado: HTTP y rollback SQL.                                                                              |
| #1439.6: conservar solicitud/oferta                             | Implementado y probado: snapshot antes/después de sanción.                                                                |
| #1439.7: concurrencia produce un evento                         | Implementado y probado: cuarto/quinto simultáneos. SMTP excluido expresamente.                                            |
| #1440.1: citas futuras impiden salir                            | Implementado y probado: PENDIENTE y CONFIRMADA.                                                                           |
| #1440.2: rechazo sin cambios                                    | Implementado y probado: roles, preferencias, disponibilidad y cupo.                                                       |
| #1440.3: revocar y liberar uno                                  | Implementado y probado: transacción y salidas concurrentes.                                                               |
| #1440.4: ofertar siguiente FIFO                                 | Implementado y probado: integración.                                                                                      |
| #1440.5: repetir no libera otro                                 | Implementado y probado: idempotencia de salida.                                                                           |
| #1440.6: regreso revalida sin prioridad                         | Implementado y probado: elegibilidad, capacidad y nuevo turno.                                                            |
| #1440.7: disponibilidad Epic7 independiente                     | Implementado y probado: cambia disponibilidad sin quitar rol/cupo.                                                        |

## D. Estado de HU6

Se conserva la detección ACTIVE/DEACTIVATED/NEVER, preferencias después de salir,
revocación del rol, apagado de disponibilidad y liberación única. Las citas futuras
Pendientes o Confirmadas rechazan la salida sin cambios. Repetir o competir por
salida no libera más cupos; una falla de reasignación revierte toda la salida.
Reingresar vuelve a pasar por elegibilidad/capacidad/FIFO.

Las consultas HU6/HU7 mantienen carga, errores y reintentos independientes. Un
error HU7 no oculta al mentor activo y un estado desconocido no ofrece una
activación ficticia. Se conserva el refresco de roles/caché tras mutaciones.
Se reutilizó Sonner para los éxitos de cuatro segundos con cierre.

Las subtareas HU6 consultadas no incluyen la definición completa de AC-03 y
AC-13; no se inventan sus textos ni se marcan como satisfechos. La certificación
WCAG completa y del despliegue oficial permanece pendiente.

## E. Estándares, gobernanza y revisión

- Controllers delgados: Zod y delegación, sin importar repositories.
- La política compartida coordina negocio en `services`; SQL, bloqueo y
  persistencia permanecen en `repositories`. Ante un conflicto H1 no se crea rol
  ni se cambian preferencias; el servicio convierte el resultado en excepción.
  Se conserva la conciliación legítima y la persistencia del intento idempotente.
- No se agregó módulo Nest ni se duplicó el sistema de activación.
- La utilidad de intención es transversal; no importa internals de un dominio.
  Se conservan `apiClient`, TanStack Query, wrapper `idb`, tokens UI y componentes
  compartidos. Los barrels solo reexportan y no recibieron lógica adicional.
- Los cambios no alteran OTP, autenticación ni correo de otras Epics.
- Comentarios nuevos útiles en español; identificadores/archivos en inglés y
  kebab-case. No se editaron comentarios generados o migraciones publicadas.
- No se modificaron `.github`, `.husky`, scripts protegidos, manifests,
  lockfiles, TypeScript, Vitest, ESLint ni Prettier para pasar checks.
- La generación Prisma se ejecutó y produjo el mismo cliente semántico. Se
  conservaron los archivos publicados cuando solo reapareció espacio final del
  generador. No se modificó `backend/prisma/` en esta revisión.
- El diff completo de la rama todavía incluye cambios Prisma del commit anterior
  `f072d484`; conservarlos no equivale a autorización Database. Su revisión sigue
  siendo necesaria conforme CODEOWNERS.

## F. Evidencias de pruebas y cobertura

Los resultados de cierre se registran en la tabla de validación final. Las
ejecuciones interrumpidas, los informes parciales y los tests omitidos no se
cuentan como aprobados. No se cambió un umbral ni una exclusión para aumentar
artificialmente la cobertura. Los logs y JSON completos permanecen fuera de Git,
en `tmp/hu67-final-*` del workspace.

Los comandos se ejecutan desde `backend/` o `frontend/`, según la fila. Las
pruebas PostgreSQL reciben `HU7_TEST_DATABASE_URL` de la base exclusiva local
`hu6_hu7_regression_test`. El comando de migraciones se ejecuta desde el workspace.
En las tablas, `vitest` abrevia el entrypoint local
`node node_modules/vitest/vitest.mjs`. En PowerShell se asignan las variables
mediante `$env:HU7_TEST_DATABASE_URL=...` y `$env:NODE_OPTIONS=...` antes del comando.

| Comprobación                                           | Comando                                                                                                                                                                                                       | Aprobadas                                 | Fallidas  | Omitidas | Resultado                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | --------- | -------- | ----------------------------------------------------------------------------------- |
| HTTP/JWT/PostgreSQL, dos esquemas, más ofertas/salida  | `vitest run src/modules/mentors/tests/mentor-regression-http.integration.spec.ts src/modules/mentors/tests/mentor-offers.integration.spec.ts --maxWorkers=1`                                                  | 88                                        | 0         | 0        | Aprobado, ejecución independiente completa.                                         |
| Capas backend después de separar política y errores    | `vitest run` sobre `mentors.repository.spec.ts`, `mentors.service.spec.ts`, `mentor-capacity.spec.ts` y `mentor-idempotency-key.spec.ts`                                                                      | 57                                        | 0         | 0        | Aprobado.                                                                           |
| Persistencia y vista frontend, verificación focalizada | `vitest run` sobre intención compartida, storage y vistas afectadas                                                                                                                                           | 63                                        | 0         | 0        | Aprobado; no es toda la suite.                                                      |
| Compatibilidad de migraciones y ledger                 | `node tmp/hu6-hu7-verify-deploy.mjs`                                                                                                                                                                          | 2 escenarios, deploy repetido en cada uno | 0         | 0        | Exit 0: base nueva e histórica; segundo deploy sin pendientes.                      |
| Prisma generado                                        | `prisma generate --config prisma7.config.ts`                                                                                                                                                                  | —                                         | 0         | —        | Exit 0; sin diferencia semántica en cliente generado.                               |
| Backend build                                          | `tsc -p tsconfig.build.json` y `node scripts/copy-mail-templates.ts`                                                                                                                                          | —                                         | 0         | —        | Exit 0.                                                                             |
| Frontend TypeScript                                    | `tsc --noEmit --incremental false`                                                                                                                                                                            | —                                         | 0         | —        | Exit 0.                                                                             |
| ESLint backend/frontend                                | `eslint` sobre los archivos TypeScript modificados                                                                                                                                                            | —                                         | 0         | —        | Exit 0 en ambos.                                                                    |
| Oxlint backend                                         | `oxlint --type-aware` sobre el módulo mentors                                                                                                                                                                 | —                                         | 0 errores | —        | Exit 0; dos advertencias unbound-method en pruebas preexistentes no modificadas.    |
| Diff                                                   | `git diff --check`                                                                                                                                                                                            | —                                         | 0         | —        | Sin errores de espacios.                                                            |
| Frontend global, pool normal                           | `vitest run --coverage --maxWorkers=2 --reporter=default`                                                                                                                                                     | 3828                                      | 0         | 0        | **Exit 0**, 462 archivos; 1233,78 s.                                                |
| Vista/modal después del ajuste visual final            | `vitest run src/modules/mentors/views/participation-view.test.tsx src/modules/mentors/components/participation/deactivate-participation-modal.test.tsx --pool=vmThreads --vmMemoryLimit=512MB --maxWorkers=1` | 18                                        | 0         | 0        | Exit 0; 42,03 s; corresponde al código de `b2c86f51`. No sustituye la suite global. |
| ESLint de los tres componentes visuales finales        | `eslint` sobre overview, activate-participation-modal y deactivate-participation-modal                                                                                                                        | —                                         | 0         | —        | Exit 0; sin configuración ni dependencias nuevas.                                   |

Cobertura frontend global, con el include/exclude y los cuatro umbrales originales:

| Métrica    | Resultado           |
| ---------- | ------------------- |
| Sentencias | 92,29 % (9086/9845) |
| Ramas      | 87,62 % (7023/8015) |
| Funciones  | 89,98 % (2678/2976) |
| Líneas     | 93,99 % (8333/8865) |

La ejecución anterior en vmThreads tuvo 3827 aprobadas y una fallida porque
`vi.stubGlobal('window')` no podía redefinir `window` en ese entorno. No se
modificó esa prueba ajena a mentorías: pasó aisladamente y luego dentro de la
suite completa con el pool normal. La ejecución vmThreads no se contabiliza
como aprobada ni se usa para certificar cobertura.

La suite global frontend anterior corresponde al commit de código `e753e3b6`.
Después se detectó y ajustó la disposición responsive de overview y de ambos
modales de participación, y el contraste de la acción de reincorporación. No se
cambiaron las reglas ni los contratos. Sus comprobaciones se registran en la
evidencia de localhost; no se atribuye retroactivamente la ejecución global al
ajuste visual posterior. CI debe volver a ejecutar sus checks sobre el SHA final.

| Comprobación backend                     | Comando                                                                                          | Aprobadas              | Fallidas                          | Omitidas                           | Resultado                                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------- | --------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global secuencial, PostgreSQL habilitado | `NODE_OPTIONS=--max-old-space-size=1024 vitest run --coverage --maxWorkers=1 --reporter=default` | 2762                   | 0 aserciones; 2 errores de worker | 0 explícitas; **19 sin resultado** | **Exit 1**. 280/282 archivos completados; no aprobado globalmente.                                                                                                                  |
| Módulo mentors dentro de esa ejecución   | Mismo comando anterior; se contabilizan sus líneas de archivos completados                       | **331 en 23 archivos** | 0                                 | 0                                  | Todos los archivos de pruebas del módulo terminaron, incluidos 74 HTTP y 39 casos de participación/FIFO/ofertas: 113 con PostgreSQL real. No convierte la suite global en aprobada. |

Los dos archivos que no completaron la ejecución secuencial son
`src/modules/educations/tests/educations.controller.spec.ts` y
`src/modules/educations/tests/educations-flow.spec.ts`. Vitest informa
`Worker exited unexpectedly`; no se atribuye una causa definitiva sin evidencia.
No se cambiaron pruebas de Educación ni configuración protegida. La ejecución
anterior completó esos archivos, pero dejó sin resultado 68 casos HTTP al fallar
otro worker. Ninguna de esas ejecuciones se presenta como una global limpia ni
se suman sus conteos para inventar una ejecución única aprobada.

Cobertura **observada en la última ejecución global incompleta**, conservando
los umbrales y exclusiones del repositorio:

| Métrica backend | Resultado observado |
| --------------- | ------------------- |
| Sentencias      | 91,65 % (4206/4589) |
| Ramas           | 86,12 % (2042/2371) |
| Funciones       | 89,58 % (1307/1459) |
| Líneas          | 91,93 % (3954/4301) |

Las cuatro métricas calculadas superan 80 %, pero **no certifican la validación
global** mientras el comando termine con error. DevOps debe reproducir el
comando completo en CI o en un runner estable y obtener exit 0, sin casos sin
resultado. Los 88 casos PostgreSQL ejecutados independientemente sí terminaron
con exit 0 y no dependen de ese informe parcial.

Los hooks del worktree apuntan a `.husky/_`, cuyo directorio generado no está
presente. No se desactivaron ni se modificaron: se ejecutaron explícitamente los
linters indicados y `node backend/scripts/check-commit-messages.ts --message-file`
para los commits de esta entrega. Esto no equivale a declarar un workflow de GitHub Actions
aprobado. Los archivos de configuración protegidos permanecen intactos.

## G. Database

No hay migraciones nuevas ni cambios adicionales en el esquema en esta revisión.
Se conserva la compatibilidad existente entre base nueva y base catalogada de
#1717/#1727. Los snapshots de solicitudes/ofertas, IDs, preferencias, fechas,
intentos y sanciones se mantienen en las pruebas.

La auditoría de los tres modelos, índices, UUID, `onDelete`, catálogos y esquema
se entrega en [la solicitud técnica de Database](mentor-intake-database-review.md).
El [borrador SQL](mentor-intake-audit-proposal.sql) no se aplicó ni se presentó
como migración autorizada. H4 y la traducción de comentarios de migración quedan
condicionados a Database. No hubo `db push`, `migrate reset` ni cambios en QA/producción.

## H. Localhost, CI y despliegue

### Evidencia local de cierre

Frontend: `http://127.0.0.1:3007/mentors/participation`; API:
`http://127.0.0.1:8087/api`. La demo anterior 3006/8086 se conservó.

| Comprobación                             | Comando / acción                                                                                              | Aprobadas                                                               | Fallidas                       | Omitidas | Resultado                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Build del código visual final            | `node node_modules/next/dist/bin/next build --webpack`                                                        | 48 páginas generadas                                                    | 0                              | 0        | **Exit 0**, compilación y TypeScript completados, fuente de `b2c86f51`.                                                            |
| Usuarios y tres endpoints prioritarios   | `node tmp/hu67-local-verify.mjs`                                                                              | 27 logins y 81 GET                                                      | 0                              | 0        | La cuenta inactiva adicional recibió el 401 esperado. Sin HTTP 500 en los GET. Se repitió al cierre.                               |
| Persistencia de concurrencia UI          | Dos pestañas reales autenticadas como Tomás; envío concurrente de Solicitar cupo con bloqueo local controlado | 2 vistas PENDING, 1 solicitud, 1 intento REQUEST, 1 UUID                | 0                              | 0        | Base local verificada antes/después y al cierre. Sin rol de mentor.                                                                |
| Persistencia tras recarga y nueva sesión | Navegador más `node tmp/hu67-ui-evidence.mjs final`                                                           | Mismo ID y queuedAt                                                     | 0                              | 0        | No se creó otra intención ni se movió el turno.                                                                                    |
| Responsive activo                        | Navegador real y lectura de `scrollWidth`                                                                     | 320, 768 y 1280 px                                                      | 0 desbordamientos horizontales | 0        | Anchos de documento 310, 768 y 1280 respectivamente; 310 incluye el espacio del scrollbar móvil.                                   |
| Modales en móvil                         | Abrir/cerrar con Sofía y Alfa, viewport 320                                                                   | Reincorporación: 286/286 px; salida: 271/271 px de ancho útil/contenido | 0 desbordamientos horizontales | 0        | Salida admite desplazamiento vertical; Tab alcanza las acciones y Escape devuelve el foco al disparador. No se confirmó la salida. |
| Contraste                                | Estilos efectivos del botón y cálculo sRGB                                                                    | 11,79:1                                                                 | 0 en ese botón                 | —        | Verificación específica; no auditoría WCAG integral.                                                                               |

El build local reutiliza las fuentes Inter/Inter Tight disponibles en el
workspace mediante `NEXT_FONT_GOOGLE_MOCKED_RESPONSES`, fuera de Git, para no
depender de la descarga de Google Fonts durante la demo. No se cambió Next,
manifests ni assets del repositorio; esto no certifica el build Docker oficial.

La demo conserva 28 usuarios ficticios, 25 titulados activos aprobados, capacidad
10, ocho mentores y dos reservas. Tomás quedó con la solicitud PENDING creada
durante QA; se conservan los demás escenarios y su historial. La guía actualizada
es `tmp/hu67-local-usuarios.md` del workspace. Los datos y credenciales de demo
no forman parte de los commits.

Evidencias fuera de Git: `tmp/hu67-ui-evidence-before.json`,
`hu67-ui-evidence-after-two-tabs.json`, `hu67-ui-evidence-final.json`,
`hu67-local-smoke.json`, `hu67-ui-desktop-final.png`, `hu67-ui-mobile-final.png`,
`hu67-ui-deactivate-mobile-final.png`, `hu67-ui-activate-mobile-final.png` y
`hu67-ui-pending-details-mobile.png`. Las medidas y capturas corresponden al
navegador controlado; se restauró el viewport normal y se dejó la demo abierta.

Los intentos anteriores de recargar mientras el frontend estaba detenido para
reconstrucción dieron conexión rechazada. No se contaron como pruebas
aprobadas: después de iniciar el servidor se verificaron de nuevo navegación y
datos. No se cambiaron protecciones del navegador ni se usó ese error como
evidencia de un fallo de la API.

Las pruebas PostgreSQL usan exclusivamente una base local de testing y esquemas
descartables. Los datos de demo siguen fuera de Git. La validación de CI y del
despliegue oficial no se infiere del resultado local.

Ruta verificada: develop → `sync-epics.yml` → Epic6 → `deploy-epic6.yml` → GHCR →
GitOps → Argo CD, namespace `umssy-epic6`. Un PR a develop directo no publica de
forma equivalente la imagen de Epic6. La referencia GitOps consultada era
`epic6-b5ff8124a12f29b168e064cb0800f742289695c3`; no demuestra por sí sola el Pod real.

Después de integración autorizada: verificar el SHA correcto, ambos builds,
tags/digests, revisión Argo/Synced/Healthy, ledger de migraciones, logs de arranque
y worker. Con QA autorizado, exigir HTTP 200 y datos correctos de:

- `/api/mentors/me/participation`
- `/api/mentor-participation/requests/me`
- `/api/mentors/capacity`

Después, probar solicitud, oferta, confirmación, salida y reingreso con cuentas QA
controladas. La ausencia de acceso autorizado al Pod/esquema/sesión oficial impide
confirmar la causa y resolución del 500 del servidor. La reproducción local 42703
y su corrección no se presentan como validación oficial.

## I. Veredicto

**BLOQUEADO POR DATABASE/DEVOPS** para integración y certificación del despliegue.

H1, H2 y H3 se implementaron; H5 se corrigió fuera de archivos protegidos. H4
requiere intervención Database para completar auditoría/catálogos/índices y revisar
la compatibilidad ya publicada. Cualquier limitación del runner/CI se expone en
la tabla de pruebas. No se declara HU7 al 100 %, ni se certifica ausencia absoluta
de errores, ni se presenta la rama como lista para desplegar automáticamente.
