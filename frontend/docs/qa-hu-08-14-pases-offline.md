# HU-08-14 Casos de prueba para pases sin conexión

Usar el mismo dispositivo y origen de la PWA. Preparar dos titulados de QA,
A y B, y un taller vigente con una inscripción confirmada para A. Para
distinguir las cuentas, usar un taller distinto para B si también se probará
su QR. Registrar el entorno, la versión y los ID de inscripción de QA.
Usar los ID como evidencia. Evitar incluir códigos QR, tokens o credenciales.

| Caso | Pasos | Resultado esperado |
| --- | --- | --- |
| Pase consultado en línea | Entrar como A, abrir el detalle del pase confirmado con internet y comprobar que aparece el QR. Cerrar la PWA, activar modo avión y volver a abrir «Mis inscripciones». | El mismo pase puede leerse desde la copia local, con fecha de última actualización. La lectura local no necesita hacer una solicitud al backend. |
| Sin precarga | Entrar como B y abrir «Mis inscripciones» sin consultar el detalle de un pase. Cerrar, activar modo avión y reabrir la PWA. | La cuenta B no tiene copias locales. La vista indica que se debe abrir un pase confirmado con internet. |
| Cambio de cuenta | Precargar el pase de A. En el mismo navegador, cerrar sesión, entrar como B y repetir la prueba sin conexión. Luego volver a entrar como A sin abrir todavía el detalle de su pase. | B no ve el pase de A. Al volver a A, la copia anterior ya no existe y se debe abrir el pase con internet para guardarlo de nuevo. |
| Respuesta tardía | Con una prueba automatizada, retrasar la respuesta del detalle de A hasta después de iniciar sesión como B. | La respuesta atrasada no vuelve a guardar el pase de A y B sigue sin copias. |

Los escenarios de persistencia, caché vacía, cierre y cambio de cuenta se
pueden repetir con `pnpm exec vitest run offline-passes.service` desde
`frontend`. El recorrido visual en modo avión se valida con la vista offline
integrada y el Service Worker de las tareas 14.1 y 14.3.

La vista puede llamar a `listOfflinePasses()` de
`src/modules/events/services/offline-passes.service.ts` una vez restaurada la
sesión. Devuelve solo las copias de la cuenta activa, incluyendo `qrToken`,
los datos del taller y `savedAt` en formato ISO. Una lectura sin coincidencia
de sesión o sin copia devuelve una lista vacía. Al consultar el detalle con
internet, `registrationsService.getPass` guarda el pase confirmado.
