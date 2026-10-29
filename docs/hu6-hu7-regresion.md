# Corrección HU-MEN-06 / HU-MEN-07

Este informe registra la entrega `f072d484`. La auditoría posterior y las
correcciones H1–H5 están en [la validación final](hu6-hu7-final-validation.md),
incluida la revisión pendiente de Database y el destino de integración Epic6.

Fecha: 28/10/2026. Rama local: `fix/grupo-6-hu6-hu7-regresion`.
Base verificada de `origin/develop`: `8f1abc4a8ba1c6941f071695bb0eb2fed695bb28`
(merge #1712). No se creó PR ni se publicó la rama: la instrucción actual del solicitante pide solamente commit local.

## Diagnóstico comprobado y límite de la evidencia

El repositorio de solicitudes de `develop` y el de
`44927ee0449c440c01dd82ad2ba04046bef3e2c3` tienen el mismo blob:
`0f1b42ca8383d0da0dc68d980c150b119dd93598`. Reemplazarlo por el histórico no arregla un desfase de esquema.

`GET /api/mentor-participation/requests/me` ejecuta controller → service →
repository → transacción Prisma → reconciliación SQL de ofertas, incluso si el
usuario no tiene ninguna solicitud. El primer UPDATE requiere `mentor_slot_offers.status`.
El catálogo introducido en #1717 eliminó esa columna y dejó `status_id`.
#1727 revirtió código y migraciones del árbol Git; eso no deshace una migración aplicada en PostgreSQL.

La prueba `mentor-regression-http.integration.spec.ts` aplica las migraciones
históricas de #1717 sobre PostgreSQL real y ejecuta ese GET con JWT y sesión de
base de datos reales: reproduce HTTP **500**, Prisma **P2010**, PostgreSQL
**42703**, `column "status" does not exist`. Después aplica la migración nueva y
comprueba HTTP 200 y los estados esperados. También conserva IDs, fechas,
preferencias, oferta vigente, sanción y eventos previos durante la migración.

**La causa del servidor oficial sigue sin confirmar.** Argo CD presentó login;
no hubo acceso autorizado a logs del Pod, al esquema oficial ni a una sesión QA
de Mentor Alfa. La reproducción local demuestra una causa compatible con el
historial y el síntoma, no prueba qué migraciones se aplicaron en ese servidor.
No se ocultaron excepciones SQL ni se convirtió un error en una solicitud vacía.

Se detectó además una diferencia observable con sesiones PostgreSQL en
`America/La_Paz`: la interpretación de instantes de Prisma y SQL debe ser
consistente. El pool runtime usa UTC, las transacciones de capacidad ya lo
hacían y ahora el historial también lo fija. Una prueba compara el historial
desde un pool con zona Bolivia con los instantes guardados.

## Comparación y alcance

| Referencia | Evidencia / decisión |
| --- | --- |
| `feature/grupo-6-hu7-backend-and-frontend` | No existe en las referencias remotas consultadas. No se inventó su contenido. |
| `feature/grupo-6-hu7-backend-and-frontend-integration` | Rama remota ausente; #1665 y su commit `44927ee0` permiten comparar. Existe un worktree histórico con una rama local de nombre distinto (`feacture/...`). Se preservó. |
| #1665 / `44927ee0` | Se conserva contrato de solicitud, preferencias, fechas, cola, ofertas y bloqueo transaccional compartido. El repository de solicitudes era idéntico al de la base actual. |
| #1712 / develop | Incluye HU6 integrada con HU7. Se conserva `MentorExitService`, la protección de citas futuras, preferencias al salir, directorio y disponibilidad reversible independiente de Epic 7. |
| #1717 | Incluía intentos persistentes, idempotencia, eventos y conversión de estados a catálogos, además de cambios de correo/autenticación. Se recuperaron selectivamente las reglas de admisión anteriores a la conversión, verificadas con pruebas. No se restauró el PR entero. |
| #1727 | Reversión confirmada por commit `2fefc44f`. Su mensaje y discusión consultada no explican el motivo funcional; no se atribuye una razón no documentada. |
| Revisión de zer4c en #1712 | Hubo observaciones de arquitectura/estándares y aprobación posterior. Se preservaron servicios de HU6 y código vigente de otras historias. Las lecturas Prisma añadidas a activación permanecen en el repository y comparten transacción. |

Cambios concretos:

- Nueva migración **aditiva** `20261028010000_mentor_intake_compatibility`, compatible
  con la base de develop y con la base catalogada del PR revertido. Agrega las
  representaciones textuales necesarias y sincroniza ambas direcciones con los
  catálogos existentes. No borra columnas, tablas, catálogos ni datos; no modifica
  migraciones anteriores. Las copias históricas SQL están solamente en fixtures de pruebas.
- Ambos POST de incorporación exigen `Idempotency-Key: UUID`; resultados y huella
  de preferencias se guardan por usuario, operación y clave en PostgreSQL.
  Reintentos equivalentes conservan resultado, ID y turno; otro payload recibe 409.
- Una transacción y el advisory lock compartido serializan admisión, capacidad,
  FIFO, ofertas, resultados, intentos y sanciones entre instancias.
- Ventana móvil de 24 horas compartida: cuatro intenciones siguen su flujo;
  la quinta crea una sanción de 72 horas exactas y un solo evento. Nuevos intentos
  durante la sanción no la renuevan. Se devuelven código, `sanctionEndsAt` y
  `Retry-After`, expuesto también por CORS. Se preservan los códigos de errores de negocio.
- Las consultas, edición y cancelación no suman intentos; una falla técnica
  revierte la operación y el intento. Los rechazos controlados sí cuentan.
- La intención del navegador se persiste mediante una transacción IndexedDB,
  incluso entre pestañas. Un timeout/500 conserva el UUID. Si no se puede guardar
  de forma durable, no se envía el POST. HU6 no depende de limpiar ese almacenamiento
  para dar por exitosa una salida que el servidor ya confirmó.
- HU6 y HU7 muestran carga/error/reintento independientes. El error de solicitudes
  no oculta al mentor activo; un estado desconocido no habilita una incorporación
  ficticia. Cancelación/vencimiento se informa también a usuarios sin participación previa.
- Eventos de oferta/sanción persistidos, **sin dispatcher SMTP HU7**. OTP y correo
  compartido de autenticación permanecen intactos.

## Matriz funcional

“Probado” significa pruebas automatizadas locales; no certifica el despliegue
oficial ni accesibilidad visual completa. Fuentes HU7:
[#1386](https://github.com/UMSSY/umssy-app/issues/1386),
[#1436](https://github.com/UMSSY/umssy-app/issues/1436),
[#1437](https://github.com/UMSSY/umssy-app/issues/1437),
[#1438](https://github.com/UMSSY/umssy-app/issues/1438),
[#1439](https://github.com/UMSSY/umssy-app/issues/1439),
[#1440](https://github.com/UMSSY/umssy-app/issues/1440).

| HU7 CA | Comportamiento | Implementación / evidencia local |
| --- | --- | --- |
| 1 | Confirmar incorpora mentor y actualiza cupos | Conservado; PostgreSQL ofertas y confirmación concurrente. |
| 2 | Contador disminuye en tiempo real | Conservado; componente de oferta con reloj simulado. |
| 3 | Reabrir conserva fecha absoluta | Conservado; prueba de reapertura/vencimiento. |
| 4 | Cancelar modal no crea solicitud | Conservado; pruebas de diálogos/wizard. |
| 5 | Carga bloquea botones | Conservado; pruebas de diálogo y wizard. |
| 6 | No cerrar mientras procesa | Conservado; pruebas de modal/Escape. |
| 7 | Titulado aprobado, vinculado, formulario y no mentor | Validado; PostgreSQL, JWT real y catálogos. |
| 8 | Recalcular capacidad antes de solicitar | Conservado; transacción compartida y conflicto controlado. |
| 9 | Duplicados rechazados sin cambiar ID/fecha | Probado en PostgreSQL y HTTP concurrente. |
| 10 | Persistir usuario, fecha, hora y estado inicial | Probado en PostgreSQL. |
| 11 | No duplicar solicitud pendiente | Probado; claves iguales y distintas. |
| 12 | Fecha, tiempo transcurrido y estado | Conservado; pruebas de participación pendiente. |
| 13 | Reabrir recalcula transcurrido | Conservado; pruebas del componente pendiente. |
| 14 | Correo institucional y truncado | Conservado; componente pendiente. Revisión visual en dispositivos pendiente. No se envía correo real. |
| 15 | Navegación a Mi participación | Conservado; pruebas del wizard/vista. |
| 16 | Modal de detalles sin efectos | Conservado; pruebas de participación pendiente. |
| 17 | Confirmar antes de cancelar | Conservado; pruebas de confirmación. |
| 18 | Cancelar y mostrar éxito | Probado; PostgreSQL y componentes. |
| 19 | Excluir cancelados conservando orden relativo | Probado; integración FIFO. |
| 20 | Oferta sustituye espera | Conservado; pruebas de componente y estados HTTP. |
| 21 | Plazo real de 24h y fecha Bolivia | PostgreSQL verifica 86.400.000 ms; frontend usa fecha absoluta/BOT. |
| 22 | Vencer con pantalla abierta bloquea confirmar | Conservado; reloj simulado del componente. |
| 23 | Reingresar muestra vencimiento y permite nueva intención | Corregido aviso sin historial HU6; estados HTTP y componente. |
| 24 | Consulta de disponibilidad e incorporación | Probado; capacidad SQL, API y servicios frontend. |
| 25 | Fondo cierra sin crear | Conservado; pruebas de diálogo. |
| 26 | Fondo desenfocado | Conservado en los componentes; certificación visual manual pendiente. |
| 27 | Recuperar interacción al cerrar | Conservado; pruebas de diálogo. Certificación visual manual pendiente. |
| 28 | Reconciliar al liberar cupo | Probado; salida, rollback y vencimiento PostgreSQL. |
| 29 | Un ofertado por cupo | Probado; dos instancias/pools independientes y evento único. |
| 30 | Confirmación simultánea sin rol/cupo duplicado | Probado; integración PostgreSQL existente. |
| 31 | Worker expira sin visitas | Conservado; pruebas de worker y reconciliación sin GET. Su ejecución oficial está pendiente. |
| 32 | Expirar reasigna FIFO con 24h nuevas | Probado; PostgreSQL y GET concurrentes con ofertas vencidas. |
| 33 | Nueva solicitud vuelve al final con nuevo ID | Probado; integración de ofertas/FIFO e historial. |

Reglas adicionales de las subtareas: UUID obligatorio y persistente, ventana
móvil, cuarto/quinto intento concurrente, sanción única/no renovable, preservación
de solicitud/oferta y rollback técnico se prueban por HTTP y PostgreSQL.
Los casos de capacidad 0, 1, 2, 3, 5, 9, 10 y 25 se verifican con redondeo hacia abajo.

HU6 se contrastó con las reglas del encargo y las subtareas
[#1540](https://github.com/UMSSY/umssy-app/issues/1540),
[#1542](https://github.com/UMSSY/umssy-app/issues/1542) y
[#1545](https://github.com/UMSSY/umssy-app/issues/1545).
No se encontró una issue principal HU6 con el texto completo numerado: no se
inventan definiciones para AC-03 y AC-13, no descritas en esas fuentes.

| HU6 criterio / regla | Estado y evidencia |
| --- | --- |
| AC-01, 19, 21: estados y acciones contextuales | Probado; ACTIVE/DEACTIVATED/NEVER y fallos independientes. |
| AC-02, 14: actualización reactiva | Probado; salida, invalidación y refresco de roles. |
| AC-03 | Texto funcional no disponible en fuentes consultadas; requiere confirmar especificación. |
| AC-04, 22: conservar preferencias y reincorporación | Conservado; pruebas HU6, wizard y PostgreSQL. No restaura prioridad previa. |
| AC-05: cancelar/cerrar sin cambios | Probado; componentes y vista. |
| AC-06: no doble envío | Probado; botones y guardia `inFlight`. |
| AC-07, 24: acceso autenticado | JWT/sesión reales y protección de edición por rol. Titulados pueden consultar su solicitud y reincorporarse conforme HU7. |
| AC-08, 09: foco/teclado/Escape | Pruebas existentes de modales; auditoría completa WCAG manual pendiente. |
| AC-10: semántica de diálogo/ARIA | Componentes conservados y pruebas de `role=dialog`; lectura asistida manual pendiente. |
| AC-11, 12: texto/contraste accesible | Insignias textuales conservadas; medición visual de contraste pendiente. |
| AC-13 | Texto funcional no disponible en fuentes consultadas; requiere confirmar especificación. |
| AC-15, 20: advertencia y confirmación | Probado; modal de salida conserva preferencias e informa consecuencias. |
| AC-16, 17: éxito 3–5s y cierre inmediato | Probado; notificación de cuatro segundos. |
| AC-18: mantener modal abierto ante error | Probado; red/servidor/citas futuras y reintento. |
| AC-23: móvil/tablet/escritorio | Diseño vigente conservado; inspección visual de todos los tamaños pendiente. |
| Revocar rol, desactivar disponibilidad y liberar un cupo | Probado; PostgreSQL, salida concurrente e idempotente. |
| Citas futuras PENDIENTE/CONFIRMADA impiden salir | Probado; rechazo sin cambios y rollback si falla la reasignación. |
| Preferencias, historial, IDs y fechas preservados | Probado; migración, salida y reingreso. |
| Epic 7 reversible mantiene rol y cupo | Probado; integración PostgreSQL existente. |

## Pruebas y compilación

Resultados finales sobre el código de esta rama:

| Verificación | Resultado |
| --- | --- |
| Backend: mentorías y contrato/filtro compartido de errores | **311/311 aprobadas**, 0 fallidas, 0 omitidas. |
| Pool Prisma y construcción de conexión compartidos | **6/6 aprobadas** adicionales. Total backend verificado: **317** pruebas distintas. |
| Subconjunto con PostgreSQL real | **91/91 aprobadas**: ofertas 14, FIFO 11, solicitudes/sanciones 14, HTTP/regresión/migración 52. Incluidas en las 311, no sumadas dos veces. |
| Frontend: mentors, mentorship y storage | **303/303 aprobadas**, 41 archivos, 0 fallidas u omitidas. |
| Build backend completo | TypeScript y copia de plantillas terminados con código 0. |
| Build frontend completo | Next.js 16.3.5/webpack: compilación, TypeScript y generación de rutas correctos. |
| TypeScript frontend separado | `tsc --noEmit --incremental false`: código 0. |
| ESLint archivos modificados no generados, backend/frontend | Código 0; sin errores. |
| Oxlint con tipos, módulo mentorías | Código 0. Dos advertencias preexistentes de métodos sin ligar en tests de directorio/controller; el nuevo archivo de regresión pasa sin advertencias. |
| Prisma migrate deploy, base nueva | Aplicación correcta y segunda ejecución sin pendientes. |
| Prisma migrate deploy, historial de #1717 | Aplicación correcta y segunda ejecución sin pendientes, conservando las entradas históricas del ledger. |
| `git diff --check` | Sin errores. |

Los intentos de ejecución interrumpidos o con reportes parciales de Vitest no se cuentan como aprobados.
Las excepciones 500 impresas por la suite HTTP son las fallas deliberadas que
verifican el diagnóstico y el rollback; cada caso exige su respuesta explícita.

Comandos reproducibles, con PostgreSQL local exclusivo:

```powershell
# Crear previamente una base local vacía llamada hu6_hu7_regression_test.
cd backend
$env:HU7_TEST_DATABASE_URL='postgresql://postgres:local@127.0.0.1:5434/hu6_hu7_regression_test'
pnpm generate
pnpm exec vitest run src/modules/mentors src/common/tests/domain-exception.filter.spec.ts src/common/tests/http-error-contract.spec.ts --maxWorkers=1
pnpm build

cd ../frontend
pnpm exec vitest run src/modules/mentors src/modules/mentorship src/shared/services/storage --maxWorkers=1
pnpm exec tsc --noEmit --incremental false
pnpm exec next build --webpack
```

Las suites PostgreSQL crean y eliminan esquemas propios. La suite HTTP exige
host loopback y nombre de base de regresión. Las cuentas `example.test` son
fixtures efímeras dentro de pruebas; no se agregan seeds ni datos de demo.
No se tocó la base de localhost ya existente. Se reutilizaron dependencias
instaladas; no se modificaron manifests, lockfiles, CI ni CODEOWNERS.
El build local de frontend utilizó respuestas de fuentes ya almacenadas para
evitar depender de Google Fonts; no se publicó ese mock ni configuración de prueba.

Se verificó adicionalmente **Prisma migrate deploy real**, dos veces por variante,
en bases locales descartables: nueva y con `_prisma_migrations` incluyendo las
dos migraciones históricas retiradas. Primera ejecución aplica la corrección;
segunda ejecución informa `No pending migrations to apply`. No se alteró el ledger
de una base existente ni se ejecutó `migrate reset`/`db push`.

## Despliegue oficial: pendiente, procedimiento para responsables

Ruta comprobada en workflows: `develop` → `sync-epics.yml` →
`epic/grupo-6-red-mentorias` → `deploy-epic6.yml` → GHCR → dispatch a
`UMSSY/umssy-app-deploy` → Argo CD. El workflow de develop publica otro entorno.
El Dockerfile backend ejecuta `prisma migrate deploy` antes de arrancar Node.

En la lectura inicial de GitOps, frontend y backend Epic6 apuntaban a
`epic6-b5ff8124a12f29b168e064cb0800f742289695c3`. Ese commit es la sincronización
de develop posterior a #1712. La definición backend tiene estrategia `Recreate`,
namespace `umssy-epic6`. Esto identifica la versión deseada en GitOps; no confirma
por sí solo el digest del Pod que estaba ejecutándose.

Antes de publicar, Database debe revisar la migración y un respaldo verificable.
DevOps debe detener escritores antiguos durante el cambio: no mezclar el contador
antiguo con la ventana móvil nueva. Mantener `Recreate` para la transición.
El puente conserva catálogos y columnas adicionales; no ejecutar `db push` para
“limpiar” el esquema ni borrar las entradas históricas de `_prisma_migrations`.

Después de una publicación autorizada por los responsables:

1. Verificar que el SHA correctivo sea ancestro del commit sincronizado de Epic6.
2. Revisar Actions: build/push de **ambas** imágenes y dispatch a GitOps correctos.
3. Comprobar los tags/digests de ambos manifests y los `imageID` de los Pods.
4. En Argo CD, comprobar aplicación, revisión, namespace, `Synced` y `Healthy`.
5. Revisar logs de arranque/migraciones: nueva migración terminada, sin P3009/P3018,
   tablas HU7 accesibles y ningún error periódico del worker. No basta el healthcheck `/api/`.
6. Consultar `_prisma_migrations` (nombre, finished_at, rolled_back_at) y
   `information_schema.columns` de requests/offers; conservar evidencia sin datos personales.
7. Con cuenta QA autorizada Mentor Alfa: login, directorio y `/mentors/participation`.
   Verificar desde Network que el frontend llama a `https://epic6-api-umssy.zer4c.dev/api`.
8. Exigir HTTP 200 y datos correctos en `/api/mentors/me/participation`,
   `/api/mentor-participation/requests/me` y `/api/mentors/capacity`.
9. Con cuentas QA separadas y operaciones controladas, probar solicitud, salida,
   reserva, confirmación, sanción y vencimiento, preservando usuarios reales.
10. Registrar SHA, digest, hora, resultado HTTP y evidencia visual. Volver a
    consultar después de un ciclo del worker para detectar errores periódicos.

No se afirma que el error oficial esté resuelto hasta completar este smoke test.

## Riesgos y pendientes explícitos

- Falta evidencia de logs/esquema/runtime y smoke test del entorno oficial.
- Hace falta revisión Database del puente temporal texto/catálogos; su retirada
  futura requiere otro cambio coordinado, no una limpieza automática de Prisma.
- El contador antiguo no contiene los instantes individuales. Se conservan
  exactamente la suspensión registrada y el inicio/conteo disponible de la ventana;
  no es posible reconstruir tiempos individuales que nunca se guardaron. Los
  nuevos intentos sí tienen su instante real de PostgreSQL.
- El advisory lock global prioriza integridad; la carga/latencia a gran escala no
  se certificó. No se realizó una prueba de caída de Kubernetes durante commit.
- Las pruebas de vencimiento cubren oferta vigente, vencida, pantalla abierta y
  condición SQL estricta `expires_at > clock_timestamp()`. La medición al
  microsegundo exacto bajo carga real y la auditoría visual/WCAG completa quedan pendientes.
- SMTP HU7 excluido por instrucción expresa. Los eventos permanecen pendientes;
  no confundir registro de evento con correo enviado. OTP/autenticación no cambiaron.
