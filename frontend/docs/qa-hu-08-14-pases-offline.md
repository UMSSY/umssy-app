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
| Pase retirado al reconectar | Precargar el pase de A, dejar ese dispositivo sin red y cancelar la inscripción de prueba desde otra sesión con conexión antes del inicio. Volver a conectar el primer dispositivo y después desconectarlo de nuevo. | La vista avisa que retiró los pases que ya no están disponibles. El QR retirado tampoco aparece en la siguiente consulta sin red. |
| Fallo temporal al reconectar | Precargar el pase, desconectar el dispositivo y volver a conectar manteniendo la API inaccesible. | La vista conserva la copia y su última actualización hasta poder confirmar el estado con el servidor. |

Los escenarios de persistencia, caché vacía, cierre y cambio de cuenta se
pueden repetir con `pnpm exec vitest run offline-passes.service` desde
`frontend`. Para el recorrido visual, usar `pnpm build` y luego `pnpm start`
en `frontend`, porque el Service Worker se registra en producción. En
localhost, usar el modo offline de DevTools para cortar las solicitudes del
navegador. Para la prueba en modo avión, usar una PWA instalada desde una
dirección HTTPS de QA.

La vista y el guardado usan la misma copia por usuario. Al cargar el detalle
en línea, `registrationsService.getPass` guarda el pase confirmado. La consulta
de la lista vuelve a validar cuáles de los pases guardados siguen disponibles.

Para comprobar la preparación automática en Chrome para Android, inicia
sesión y espera «Pases listos sin conexión» en Inicio, sin abrir «Mis
inscripciones». Pulsa «Instalar app» si Chrome ofrece la instalación. Cierra
la PWA, activa modo avión y ábrela desde el ícono. Entra a «Mis inscripciones»
y verifica el QR de un taller vigente. Usa también una cuenta sin pases para
comprobar que una lista vacía confirmada completa la preparación.

## Navegación y datos ampliados

- Con internet, entrar con una cuenta y esperar la preparación de pases. Se descargan también las páginas del catálogo autenticado, sus detalles, categorías y datos de sesión.
- Activar modo avión y recargar Inicio, Login, Talleres y Mis inscripciones. La instalación prepara además las rutas fijas de la aplicación que devuelven HTML público cacheable.
- En Talleres, abrir un detalle guardado. La copia corresponde a la cuenta activa. Los filtros nuevos que no tengan una consulta guardada pueden requerir conexión.
- Seguir un enlace interno a una pantalla guardada. Si la pantalla no está guardada, debe mantenerse la pantalla actual y aparecer «Conéctate para abrir esta sección».
- Intentar enviar una acción de servidor sin conexión. Debe aparecer «Necesitas conexión para realizar esta acción» y no debe enviarse automáticamente al reconectar.
- Reabrir la aplicación offline con la sesión previamente guardada. Al reconectar, el backend valida la sesión y exige autenticación si responde 401.
- Cambiar de cuenta y comprobar que no se recuperan datos del catálogo ni de sesión de la cuenta anterior.

Pendientes de integración: Mis talleres requiere un endpoint de talleres gestionados. Los datos de otros módulos, las imágenes remotas y las páginas con identificadores dinámicos requieren su propia preparación. El catálogo público sin sesión conserva su consulta online. La cobertura anterior no equivale a disponer de todos los datos del proyecto offline.
