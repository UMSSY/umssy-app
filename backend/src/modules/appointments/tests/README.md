# Pruebas de integración de mis citas (H6-E, #1173)

Desde `backend/`, con Docker en ejecución:

```sh
pnpm exec vitest run src/modules/appointments/tests/appointments.integration.spec.ts
```

La suite también corre con `pnpm test` y `pnpm test:cov`, comandos usados por el CI existente. Requiere el CLI de Docker, un daemon accesible y acceso a la imagen `postgres:18-alpine` (o que ya esté descargada). No omite escenarios si Docker falta: la preparación falla para que un CI verde no oculte estas pruebas.

Cada ejecución crea un contenedor con nombre aleatorio y puerto local asignado por Docker. Aplica las migraciones existentes con Prisma y carga los usuarios, los temas y el seed B-08 mediante sus funciones reales. No lee una conexión de desarrollo para las consultas: el cliente Prisma usa exclusivamente el puerto del nuevo contenedor. No modifica `.env`, esquema, migraciones ni workflows. Al terminar, incluso si falla un escenario, desconecta Prisma y elimina solo ese contenedor temporal.

Las peticiones pasan por login, JWT, sesión consultada en PostgreSQL, guards, validación, controller, service, repository, mapper, interceptor y filtro reales. Solo se configura la conexión aislada y una clave JWT de prueba; no se sustituyen consultas ni servicios por mocks.

Los escenarios verifican próximas y pasadas de mentor y titulado, orden, consistencia entre detalle y listado, contraparte, UTC, tema y estado, listas vacías, aislamiento de sesión y acceso ajeno 403. Para verificar el orden de pasadas se agregan dos citas temporales, que se eliminan al terminar cada caso. El conjunto B-08 de 53 citas permanece intacto.

El caso de rendimiento realiza tres peticiones HTTP completas y comprueba que **cada una** devuelve las 50 citas de mentor.b en **menos de 3000 ms**, incluida la primera llamada. Usa `performance.now()`; solo `Date` queda congelado después del seed de usuarios para evitar cambios de semana durante la ejecución. No incluye descarga del contenedor, migraciones, seed o login en el tiempo del endpoint, ni mide renderizado del frontend. Imprime las tres mediciones en la salida del runner.

Para comprobar la cobertura del módulo con las suites existentes y esta integración:

```sh
pnpm exec vitest run src/modules/appointments/tests --coverage --coverage.include="src/modules/appointments/**/*.ts" --coverage.exclude="src/modules/appointments/tests/**"
```

Los umbrales existentes del 80 % se aplican a líneas, sentencias, funciones y ramas. No se cambia la configuración compartida de cobertura.
