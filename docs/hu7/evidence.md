# HU7 — evidencia local

La primera parte documenta la implementación del 23/10/2026. La actualización definitiva del 24/10/2026 está al final. Para ejecutar la versión actual usar [README.md](README.md).

## Fuentes y alcance

- Se leyó completo el prompt local `C:\Users\usuario\Downloads\Prompt_Maestro_HU7_UMSSY_Codex_LOCAL_Actualizado.md`, la issue #1386, HU3 #1122 y los PR #1148, #1065 y #1098 en modo lectura.
- El usuario aportó después `C:\Users\usuario\Downloads\hu7.pdf`. Se abrieron visualmente las dos páginas: seis mockups en la primera y 16 criterios en la segunda. Se recorrieron los seis estados en el navegador local con cuentas semilla.
- Rama local observada: `fix/grupo-6-hu5-toast-timeout`. Había cambios previos del usuario en `backend/src/common/database/seeds.ts`, `backend/src/prisma/internal/class.ts` y `backend/src/modules/mentors/seeds/mentors.seed.ts`. Se conservaron. No se hizo commit, push, merge, PR ni despliegue.

## Verificaciones ejecutadas

| Verificación | Resultado observado |
|---|---|
| Dependencias backend/frontend con lockfile | Instalación completada usando Node 22.14.0 y pnpm 12.14.0 local. |
| `prisma validate` y `prisma generate` | Pasaron; cliente generado actualizado desde `schema.prisma`. |
| Backend `tsc -p tsconfig.build.json --noEmit` y `tsc -p tsconfig.seed.json --noEmit` | Pasaron. |
| Backend `pnpm build` | Pasó. |
| Backend `pnpm lint` | Pasó, con una advertencia previa en chat. |
| Pruebas dirigidas backend: capacidad, controller mentor, respuesta de mentoría y autenticación de disponibilidad | 31 pruebas pasaron en total; Supertest necesitó ejecución local fuera del sandbox para abrir puerto efímero. |
| Frontend `tsc --noEmit` | Pasó tras integrar HU7. |
| ESLint frontend completo | Pasó con 0 errores y 1053 advertencias de estilo distribuidas por el repositorio. ESLint dirigido a las vistas/panel HU7 también pasó sin errores. |
| Pruebas dirigidas de las vistas de mentoría/participación | 31 pasaron, incluidas apertura/reapertura de oferta y detalle pendiente a partir del PDF. |
| Suite completa backend `vitest run --maxWorkers=4` | 1859 pasaron y 6 fallaron. Cinco pertenecen a pruebas del seed anterior que esperan otra implementación; la sexta fue timeout de JWT durante ejecución paralela. Esa prueba JWT pasó sola (1/1). |
| Suite E2E heredada de NestJS | 3 pasaron, 1 falló y 4 estaban omitidas. La prueba de “Mis pases” espera 200, pero el guard de autenticación respondió 401 con su mock actual. Se conservó el test original; las rutas HU7 se comprobaron aparte con JWT y PostgreSQL reales. |
| Frontend `next build --webpack` | Pasó con fuentes Inter/Inter Tight locales y licencias OFL; 40 rutas generadas. La versión compilada respondió en `localhost:3000` y mostró la solicitud pendiente real de `hu7.12`. |
| PostgreSQL local | PostgreSQL 18.6 portable, clúster propio en `tmp/hu7-local/postgresql/data`, base `app_db`, 18 migraciones aplicadas mediante `prisma migrate deploy --config prisma7.config.ts`. |
| Seeds | Seed base completado. Seed HU7 ejecutado dos veces sin duplicados: 25 titulados aprobados vinculados, capacidad 10, 9 mentores activos, 1 reserva, 0 disponibles. |
| Integración real API/DB | Login y `GET /capacity`/`GET /me` correctos; solicitud `PENDING`, duplicado 409 con mismo ID/fecha, cancelación `CANCELLED`, inelegible 403 y abandono bloqueado 409 por cita futura `CONFIRMADA`. |
| SMTP Mailpit | Mailpit v1.32.0 portable recibe mensajes del outbox. Tras el recorrido del formulario con `hu7.12@umssy.test` había 5 mensajes, incluyendo “Solicitud de cupo recibida” para esa cuenta. |
| Navegador local | Login y rutas `/mentorship` y `/mentors/participation` respondieron con Next.js. Se vieron oferta con contador y fecha BOT (`hu7.07`), espera y detalle (`hu7.08`), diálogo de cancelación (`hu7.08`), activo (`hu7.01`) y aviso sin cupos más éxito de solicitud (`hu7.12`). |

La primera pasada completa de backend mostró 1855 correctas y 10 fallidas. Cinco fallos de autenticación se corrigieron ajustando el mock a la instancia real de `JwtService`; su ejecución dirigida pasó (5/5). En la segunda pasada quedaron cinco fallos del seed previo: las pruebas no preparan `seedMentors`, todavía esperan nueve transacciones por módulo y esperan validar `SEED_TRANSACTION_TIMEOUT_MS`, mientras el `seeds.ts` que ya estaba modificado por el usuario usa una sola transacción con timeout fijo. No se reescribió ese trabajo previo. La prueba JWT que agotó 5 segundos en la suite paralela pasó sola en 1.89 segundos.

## Pendientes y riesgos de integración

1. `AccessRequest.approvedUserId` es un vínculo explícito y seguro. El proceso real de aprobación de Epic 1 aún no crea `User` ni rellena ese vínculo; los fixtures HU7 sí lo establecen. Una aprobación real nueva necesitará ese enlace antes de participar.
2. Los tests de seed antiguos no reflejan los cambios previos del usuario en `seeds.ts`; no se alteró esa implementación ajena a HU7 para satisfacer aserciones antiguas.
3. La suite completa frontend se interrumpió tras más de 20 minutos y un fallo observado; las 31 pruebas dirigidas HU7 pasaron. No se informa un resultado global inexistente.
4. Quedan sin ejercicio manual una carrera de dos confirmaciones, el vencimiento de 24 horas por reloj real y la comparación detallada del diseño de escritorio; los tests dirigidos cubren las reglas principales con reloj simulado.
5. La pantalla activa conservó un error transitorio de React `removeChild` durante Hot Module Reload al cambiar la fuente en desarrollo; una recarga completa lo eliminó. La compilación final permite distinguir ese efecto del código de producción.

## Reversión local no destructiva

Cerrar los cuatro procesos portables mostrados en `README.md` con Ctrl+C. Mantener el clúster y la migración aplicada hasta contar con una reversión SQL revisada; no usar `migrate reset`, `db push` ni borrar el directorio de datos. Los archivos `.env` y `.env.local` son locales e ignorados. Para separar la implementación HU7 de trabajo previo, revisar `git diff` y los archivos no rastreados listados, sin hacer `git reset --hard` ni `git clean`.

## Actualización v3 — 24/10/2026

Se leyó completo `C:\Users\usuario\Downloads\Prompt_Maestro_HU7_UMSSY_Local_v3_Reglas_Confirmadas.md`. Sus instrucciones se aplicaron como especificación de trabajo subordinada al pedido explícito del usuario: solo localhost, sin acciones remotas ni Git. Se conservaron cambios previos y la rama local existente. Docker Desktop seguía ausente, pese a la afirmación antigua del documento. Se usaron PostgreSQL y Mailpit portables ya instalados localmente. El clúster anterior no inició por memoria compartida residual; se copió a `data-v3` y arrancó en 5433 sin borrar el original. Mailpit inició en 8026/1026 y NestJS/Next.js en 8081/3001 por puertos originales ocupados.

| Prueba v3 | Resultado observado |
|---|---|
| Migración | `20261024010000_mentor_hu7_abuse_control` aplicada con `prisma migrate deploy --config prisma7.config.ts`; 19 migraciones totales. Tablas de intentos/sanciones, índice único `(userId,idempotencyKey)`, historial y outbox compatible con sanción sin solicitud. |
| Generación/compilación | `prisma generate` completó; `tsc -p tsconfig.build.json` backend y `tsc --noEmit` frontend pasaron. |
| Pruebas dirigidas backend | 3 archivos, **26/26** pruebas pasadas: política de abuso, controller mentor y contrato HTTP. Supertest necesitó ejecución fuera del sandbox para sockets efímeros; no fue un fallo de código. |
| Pruebas dirigidas frontend | 3 archivos, **34/34** pasadas: wizard, panel de participación y reutilización de clave ante fallo de red. Vitest usó una carpeta temporal dentro del workspace por bloqueo del directorio temporal de Windows. |
| API real y BD | `scripts/hu7-local-smoke.mjs`: quinto intento HU7 y HU3 429, reintento de clave y sexto sin duplicado, solicitud existente intacta, cita futura 409, pausa idempotente, retorno por cupos/FIFO. Pasó completo. |
| Límites y carreras | `scripts/hu7-boundaries.local-smoke.mjs`: 71 h 59 min bloqueado; vencimiento exacto desbloquea, cuatro intentos fuera de 24 h no sancionan, cinco dentro sí; cinco POST paralelos crean una sanción/correo; dos pausas paralelas liberan un cupo. Pasó completo. |
| SMTP caído y restaurado | Se detuvo Mailpit, se sancionó `.19` con 429, el outbox quedó `PENDING` y el worker avisó del reintento. Al reiniciar Mailpit, outbox `SENT` en el tercer intento y **un** mensaje en la bandeja para `.19`. |
| Frontend real | Next.js 16 `dev` respondió 200 en `127.0.0.1:3001`; navegador local mostró cuenta `.18` sancionada, cupos reales 10/10 y ausencia del botón de alta. Con `.01` mostró estado activo y modal «¿Pausar mentoría?»; con `.14`, espera, detalles y confirmación de cancelación; con `.09`, oferta y contador BOT. Se cerraron los modales de prueba sin confirmar ni cancelar para preservar estos estados. |
| Seeds y estado | Seed HU7 ejecutado en la copia de DB; 25 aprobados vinculados y tope 10. Tras los escenarios, 7 mentores + 3 ofertas = 10 ocupados. `scripts/hu7-prepare-visible.local.mjs` creó `.14` y `.20` `PENDING` para mantener visibles los seis mockups. |
| Build optimizada Next | Se inició `next build`; Turbopack permaneció en «Creating an optimized production build» sin terminar y se interrumpió. Se usó la ejecución `next dev` para la prueba visual y funcional solicitada. |
| Lint dirigido | `oxlint --type-aware` backend en archivos HU7 terminó sin errores. ESLint dirigido frontend se inició pero quedó sin salida durante varios minutos y se interrumpió; no se informa como aprobado. TypeScript y 34 pruebas frontend sí pasaron. |

El clúster PostgreSQL portable usa `America/La_Paz`. Durante la prueba de 72 h se detectó que el adaptador Prisma escribía/filtraba algunas fechas con cuatro horas de desfase cuando heredaba esa zona. Se configuraron sesiones UTC **solo** en las transacciones HU7, el worker de su outbox y el seed HU7, sin cambiar la conexión compartida por otros módulos; el control temporal usa `clock_timestamp()` de PostgreSQL para sanciones y ventana móvil. Las pruebas de límites se repitieron y pasaron. Dos intentos de prueba de `.17` con marca futura quedaron auditados como `TECHNICAL_TEST` y `counted=false`, sin borrarlos. La cuenta `.17` recibió después un cuarto intento válido para la demo. El seed fuente nuevo ya usa UTC; no se reejecutó sobre la demo mutada porque reviviría mentores de fixture que pausaron durante la prueba.

Tras aislar UTC a HU7 se compiló backend de nuevo y se comprobó con `.22` un `409 NO_SLOTS`: la marca `occurred_at` quedó dentro de los dos minutos reales anteriores según `now()` de PostgreSQL. Los cuatro servicios seguían activos y los endpoints de Next.js, NestJS y Mailpit respondían en los puertos de la guía.
Una consulta a `/mentor-participation/me` sin JWT devolvió 401; `.14` intentó confirmar la oferta ajena de `.07` y recibió 404, sin adquirirla.

La suite global y E2E heredada no se repitió en v3 porque las fallas ajenas ya observadas el 23/10 no guardan relación con estas reglas. Quedan pendientes pruebas amplias de regresión con una rama integrada de Epic 7 y un flujo real de provisión Epic 1. No se hizo commit, push, PR, merge ni despliegue.

Capturas locales: [confirmación de pausa HU7](pausa-v3.png), [oferta con contador](oferta-v3.png) y [bandeja Mailpit](mailpit-v3.png). Provienen de aplicaciones ejecutadas en localhost, sin datos reales.
