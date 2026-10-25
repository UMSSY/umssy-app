# HU-MEN-07 — demostración local v3

Estado comprobado el 24/10/2026. Todo está en esta computadora. No se hizo commit, push, PR, merge, despliegue ni cambio remoto. Esta guía reemplaza las decisiones anteriores sobre «pausar mentoría». Fuentes: prompt local `C:\Users\usuario\Downloads\Prompt_Maestro_HU7_UMSSY_Local_v3_Reglas_Confirmadas.md`, mockups `C:\Users\usuario\Downloads\hu7.pdf`, [HU7 #1386](https://github.com/UMSSY/umssy-app/issues/1386), [HU8 #1184](https://github.com/UMSSY/umssy-app/issues/1184) y [Epic 7 #1176](https://github.com/UMSSY/umssy-app/issues/1176). Las issues se leyeron sin modificarlas.

## Abrir la demo actual

| Servicio | URL local | Puerto |
|---|---|---:|
| Next.js | [Inicio de sesión](http://127.0.0.1:3001/login) | 3001 |
| NestJS | [Swagger](http://127.0.0.1:8081/docs) | 8081 |
| Mailpit | [Bandeja de correos](http://127.0.0.1:8026) | 8026 web, 1026 SMTP |
| PostgreSQL portable | `127.0.0.1` | 5433 |

Se usaron puertos alternativos porque `5432`, `8025`/`1025`, `8080` y `3000` seguían ocupados por procesos de una sesión anterior que Windows no permitió recuperar. Docker Desktop no está instalado en este equipo; se usaron versiones portables locales. Los archivos ignorados `backend/.env` y `frontend/.env.local` ya apuntan a estos puertos. No publicar esos archivos: contienen credenciales locales. La base `app_db` de la copia `tmp/hu7-local/postgresql/data-v3` tiene 19 migraciones aplicadas.

Contraseña de **todas** las cuentas ficticias HU7: `Prueba123`. Iniciar sesión con rol `titulado`, salvo los mentores activos, que pueden entrar con `mentor`. Los escenarios comparten datos y **son mutables**: confirmar una oferta, cancelar o pausar cambia la cola siguiente. El recorrido recomendado deja la cancelación y las confirmaciones para el final.

## Los seis mockups, con datos reales

| Orden | Mockup | Cuenta y recorrido |
|---:|---|---|
| 1 | Sin cupos | `hu7.22@umssy.test` → `/mentorship` → elegir «Participar», un área y una orientación → confirmar activación. Aparece «No hay cupos disponibles». «Cancelar» no crea nada; «Solicitar cupo» crea `PENDING` y Mailpit muestra «Solicitud de cupo recibida». |
| 2 | Oferta de cupo | `hu7.09@umssy.test` → `/mentors/participation`. Abrir «Ver oferta»: fecha límite BOT y contador desde `expiresAt` persistido. «Confirmar participación» activa el rol y envía correo. La oferta caduca 24 h después de `offeredAt`, incluso si el correo tarda. |
| 3 | Ver más detalles | `hu7.14@umssy.test` → `/mentors/participation` → «Ver más detalles». Consultar fecha original, tiempo, áreas, orientaciones y correo de la solicitud `PENDING`. Cerrar no cambia datos. |
| 4 | Mentor activo | `hu7.01@umssy.test` → `/mentors/participation`. Ver áreas, orientaciones y «Ir al directorio». «Pausar mentoría» abre una confirmación explícita de pérdida de rol y cupo; usar «Volver» si se quiere conservar este estado para la demo. |
| 5 | Espera y preferencias | `hu7.20@umssy.test` → `/mentors/participation`. La sanción histórica ya venció y ahora tiene una nueva solicitud `PENDING`. «Corregir preferencias» permite editar sin perder fecha ni posición FIFO; recargar para comprobar persistencia. |
| 6 | Cancelación | `hu7.14@umssy.test` o `hu7.20@umssy.test` mientras siga `PENDING` → «Cancelar solicitud». La confirmación avisa la pérdida de posición FIFO. Tras confirmar queda `CANCELLED` y Mailpit recibe el aviso. Esto cambia las cuentas de las pantallas 3/5. |

Otros estados: `hu7.13@umssy.test` muestra una solicitud `EXPIRED` histórica y el enlace para iniciar otra; `hu7.10@umssy.test` conserva una oferta aunque fue sancionado después de cinco intentos. `hu7.15@umssy.test`, `.16`, `.18`, `.19` y `.21` tienen sanción activa; su pantalla muestra el vencimiento en hora de Bolivia, el tiempo restante y bloquea nuevas altas sin impedir la consulta. `hu7.17@umssy.test` tiene **cuatro** intentos recientes: su siguiente clic distinto de activación dispara la sanción de 72 h y un correo. `mentor.b@umssy.test` tiene cita futura confirmada: intentar «Pausar mentoría» devuelve 409 y muestra el enlace a la agenda. `hu7.03@umssy.test` ya pausó: perdió el rol; `hu7.02@umssy.test` pausó y volvió a postular sin prioridad, por lo que ahora tiene una oferta obtenida por FIFO. `hu7.no-aprobado@umssy.test` recibe 403 al pedir cupo.

## Reglas implementadas

- Capacidad: `floor(titulados aprobados y vinculados × 0,40)`. La población comprobada es 25, capacidad 10. Tras las pruebas, 7 mentores activos y 3 ofertas reservadas ocupan los 10 cupos. `isAvailableForMentoring` no determina pertenencia. La fila `mentor_capacity_policies.GLOBAL` se bloquea con `SELECT ... FOR UPDATE` para ingresar, ofrecer, confirmar, cancelar, vencer y pausar.
- FIFO: `queuedAt ASC, id ASC`. Cada oferta reserva un cupo durante 24 h desde `offeredAt` del backend. Si vence, **solicitud y oferta** quedan `EXPIRED`; una nueva postulación crea otro ID al final de la cola. Los estados viejos se conservan.
- Antispam: se cuentan tanto `POST /mentors/activate` (HU3) como `POST /mentor-participation/requests` (HU7), incluidos los intentos explícitos rechazados por una solicitud pendiente. Cuatro intentos distintos dentro de 24 h siguen el flujo normal. El quinto se rechaza 429, crea una sanción de 72 h exactas y un único evento de correo. El sexto se bloquea sin otra sanción ni correo. La clave UUID `Idempotency-Key` es obligatoria en ambas rutas; un reintento con esa clave repite el resultado sin aumentar el contador. El frontend guarda la clave en `sessionStorage` ante error de red/5xx y crea otra solo tras un resultado definitivo. GET, edición y cancelación no cuentan. Un 500 revierte la transacción y no cuenta.
- La respuesta 429 usa `MENTOR_REQUEST_SUSPENDED`, `sanctionEndsAt` UTC y cabecera `Retry-After` en segundos. El backend compara timestamps en PostgreSQL; el cliente presenta fecha y cuenta regresiva en `America/La_Paz`. Solo las transacciones HU7, el worker de su outbox y su seed usan sesión UTC para evitar el desfase detectado en este clúster PostgreSQL local configurado en Bolivia.
- «Pausar mentoría» es salida definitiva HU7: comprueba citas futuras `PENDIENTE`/`CONFIRMADA`, revoca el rol mentor (`UserRole.deletedAt`), marca `LEFT`, pone `isAvailableForMentoring=false` y ofrece **un solo** cupo al siguiente FIFO dentro de la misma transacción. Una segunda llamada devuelve `alreadyLeft`. Volver exige elegibilidad Epic 1, control de sanciones, 40% y cola normal; no restaura la plaza.
- Esta rama no tiene una ruta independiente «Mis citas». El 409 incluye `appointmentsUrl: /mentor/availability` y la UI enlaza «Mis citas (agenda)» a la grilla de disponibilidad existente, que muestra los bloques con citas. La resolución de la cita sigue el flujo de appointments de Epic 7; HU7 no cancela citas por su cuenta.
- Las notificaciones usan outbox idempotente y SMTP **solo local**. El worker reconcilia ofertas y correo cada 15 s. Una caída de Mailpit no revierte solicitudes ni sanciones; reintenta cuando vuelve. SMTP no da garantía de entrega exactamente una vez si fallara entre aceptación y actualización del outbox.

## Diferencia con Epic 7 / HU8

Las issues [#1184](https://github.com/UMSSY/umssy-app/issues/1184) y [#1176](https://github.com/UMSSY/umssy-app/issues/1176) piden el interruptor reversible «Recibir solicitudes de mentoría»: cambia disponibilidad y conserva rol, cupo y citas. En el árbol local, `MentorsService.updateAvailability` llama a `MentorsRepository.updateAvailability`, que cambia `User.isAvailableForMentoring`; no se encontró un controller ni un control frontend que invoque esa operación en esta rama. El botón HU7 de `frontend/src/modules/mentorship/components/participation/mentor-participation-panel.tsx` invoca exclusivamente `POST /mentor-participation/me/leave`. Se dejó intacto el servicio/repositorio de Epic 7. Si el equipo pretende reutilizar un único control visual para ambos significados, el contrato es incompatible y se debe coordinar antes de integrar las épicas. Los tests HU7 comprueban revocación; los criterios de disponibilidad reversible de Epic 7 deben seguir probándose por separado.

## API local

Todas las rutas usan JWT, prefijo `/api` y sobre `{statusCode, ok, detail, data}`. `GET /mentor-participation/me` devuelve estado, solicitud propia y sanción activa o `null`. `GET /mentor-participation/capacity` devuelve los conteos. `PATCH /mentor-participation/me/preferences` edita solo `PENDING`; `POST /mentor-participation/me/cancel` cancela `PENDING`/`OFFERED`; `POST /mentor-participation/offers/:id/confirm` confirma antes de vencer; `POST /mentor-participation/me/leave` pausa de forma definitiva. `POST /mentors/activate` y `POST /mentor-participation/requests` exigen `Idempotency-Key: <UUID>` y preferencias con al menos un UUID válido de área y orientación. El servidor obtiene el usuario del JWT, nunca del cuerpo.

## Reiniciar después de cerrar la app

Abrir cuatro terminales PowerShell, una por bloque. Las rutas y credenciales locales ya están configuradas en `.env` ignorados. No repetir los scripts `hu7-local-smoke.mjs` o `hu7-boundaries.local-smoke.mjs` sobre este estado: **mutan** cuentas de demostración. Si se prepara otra base desde cero, aplicar migraciones y seeds allí primero.

```powershell
& 'C:\Users\usuario\Documents\ChatGPT\is-UMSSY\tmp\hu7-local\postgresql\pgsql\bin\postgres.exe' -D 'C:\Users\usuario\Documents\ChatGPT\is-UMSSY\tmp\hu7-local\postgresql\data-v3' -h 127.0.0.1 -p 5433
```

```powershell
& 'C:\Users\usuario\Documents\ChatGPT\is-UMSSY\tmp\hu7-local\mailpit\mailpit.exe' --listen 127.0.0.1:8026 --smtp 127.0.0.1:1026 --database 'C:\Users\usuario\Documents\ChatGPT\is-UMSSY\tmp\hu7-local\mailpit\mailpit.db' --disable-version-check --allowed-hosts localhost,127.0.0.1
```

```powershell
cd 'C:\Users\usuario\Documents\ChatGPT\is-UMSSY\umssy-app\backend'
& 'C:\Users\usuario\AppData\Local\Author Software\nvm\installs\v22.14.0\node.exe' dist\main.js
```

```powershell
cd 'C:\Users\usuario\Documents\ChatGPT\is-UMSSY\umssy-app\frontend'
& 'C:\Users\usuario\AppData\Local\Author Software\nvm\installs\v22.14.0\node.exe' node_modules\next\dist\bin\next dev --hostname 127.0.0.1 --port 3001
```

Si se modifica backend, compilar antes de reiniciarlo:

```powershell
cd 'C:\Users\usuario\Documents\ChatGPT\is-UMSSY\umssy-app\backend'
& 'C:\Users\usuario\AppData\Local\Author Software\nvm\installs\v22.14.0\node.exe' node_modules\typescript\bin\tsc -p tsconfig.build.json
```

La migración nueva es `20261024010000_mentor_hu7_abuse_control`. Se aplicó con `prisma migrate deploy --config prisma7.config.ts`, no con `db push` ni `migrate reset`. El seed HU7 se ejecutó con `NODE_ENV` de desarrollo y rechaza producción. La cuenta semilla 4 intentos permanece en el código aunque durante estas pruebas se consumió en vivo; la cuenta `.17` representa ahora ese estado en esta base. Para datos originales reproducibles, usar una **nueva** base local y los seeds base/HU7. No ejecutar el seed sobre esta demo mutada esperando que revierta todas las interacciones: es idempotente y conserva historial.

## Verificación y límites

Las pruebas en [evidence.md](evidence.md) cubren endpoints HTTP reales, PostgreSQL, Mailpit, límites temporales, concurrencia, pausa y frontend. La compilación de TypeScript backend/frontend pasó. Next.js 16 en modo desarrollo respondió en localhost y el navegador mostró sanción y confirmación de pausa. La compilación optimizada con Turbopack se detuvo sin diagnóstico tras quedarse en «Creating an optimized production build»; la experiencia solicitada se verificó con `next dev`. No se ejecutó una regresión completa de toda la aplicación v3; los fallos preexistentes de seed/E2E de la sesión anterior siguen documentados en `evidence.md`. La aprobación real de Epic 1 aún no aprovisiona ni enlaza `User`; los fixtures locales sí tienen `AccessRequest.approvedUserId` explícito y no se infiere aprobación por correo.
