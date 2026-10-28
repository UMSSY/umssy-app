# QA independiente HU6/HU7 en Vercel

Publicación: 28/10/2026, America/La_Paz. Este entorno es una demo de QA con
datos ficticios; no reemplaza el despliegue oficial de Epic 6 en Kubernetes.

## Enlaces y procedencia

- Frontend: https://umssy-hu67-qa.vercel.app
- API: https://umssy-hu67-qa-api.vercel.app
- Frontend Vercel: `dpl_D1hgXq9KoCCBrFJLdRVy8rHjfAis`.
- API Vercel verificada: `dpl_9qKaV9TPCCiXvXFM2vVabca4XZHX`.
- Base de código: `0a97a2ec14cee2108bd675798a8bea415623b531`.
- Configuración de correo QA: `7c696f593fc17650f7a61c5f11031045a3c20988`.
- Este commit conserva además el bootstrap asíncrono validado en la API pública.

Se crearon dos proyectos nuevos y una base Neon Free independiente. Se usó
la cuenta Hobby existente; no se cambiaron planes ni proyectos anteriores.
Las migraciones versionadas existentes se aplicaron únicamente en esa base
nueva, comprobada vacía. La propuesta Database del informe anterior no se aplicó.

## Ajustes de arranque

La primera publicación detectó el requisito de SMTP en producción. QA usa
`NODE_ENV=production`, `UMSSY_DEPLOYMENT_ENV=qa` y `MAIL_TRANSPORT=console`.
La excepción permite solamente el transporte de consola con esa etiqueta
explícita. Sin ella permanecen los requisitos SMTP anteriores; si QA elige SMTP,
también siguen vigentes sus requisitos de credenciales y TLS. No se envían
correos reales en esta demo.

La espera superior de `bootstrap()` bloqueaba el arranque serverless. Se cambió
por `void bootstrap().catch(...)`, manteniendo el manejo de errores. Después de
ese cambio la URL pública respondió y se completaron los accesos y operaciones
descritos abajo. El patrón coincide con el ejemplo de
[NestJS en Vercel](https://vercel.com/docs/frameworks/backend/nestjs).

No se cambiaron JWT, roles, contratos de mentorías, dependencias, workflows ni
umbrales de cobertura. Las verificaciones públicas se hicieron sin bypass de
protección de Vercel.

## Datos y evidencia real

- 50 usuarios ficticios: 49 accesos válidos y una cuenta inactiva rechazada con 401.
- 47 titulados activos aprobados: `floor(47 * 0.4) = 18` cupos.
- 16 mentores activos, dos ofertas vigentes y 12 solicitudes pendientes iniciales.
- Escenarios de citas futuras, disponibilidad apagada, historial cerrado,
  sanciones y cuatro intentos previos preparados para los testers.
- 147 GET públicos de participación, solicitudes y capacidad: todos correctos.
- Login desde el frontend público y pantalla de participación activa verificados
  en navegador.
- Solicitud real: creación 201, reintento con la misma clave 201 y mismo ID,
  cancelación 200. Se conserva el historial del usuario de smoke.
- Oferta propia: activación directa 409 y reintento 409; una única intención
  persistida y reserva intacta. Capacidad posterior: 18 ocupados de 18.
- Correo: 24 tests aprobados; incluidos consola QA sin SMTP y conservación de
  los requisitos de producción. TypeScript y ESLint de los cambios: exit 0.
- Builds remotos frontend y API: READY; el estado READY se complementó con las
  pruebas públicas anteriores y no se tomó como prueba suficiente por sí solo.

Los usuarios, contraseñas, seed, secretos y resultados completos permanecen
fuera de Git, en `tmp/hu67-qa50-*` del workspace. La entrega incluye CSV y guía
para que el solicitante los comparta con sus testers. El registro de smoke
identifica al usuario cuya solicitud se creó y canceló; no se borró su historial.

## Límite conocido del worker

Vercel Hobby permite cron como máximo una vez al día; por eso esta demo no
certifica el vencimiento y la reasignación en segundo plano sin visitas. La
conciliación mediante tráfico y el intervalo existente no sustituyen una
programación durable. Para certificar ese criterio hace falta un ejecutor
programado compatible o una configuración de hosting/plan adecuada. Véanse los
[límites oficiales de cron](https://vercel.com/docs/cron-jobs/usage-and-pricing).

La revisión Database pendiente y la validación de la integración oficial
Epic 6 → develop siguen siendo trabajos distintos de esta QA independiente.
