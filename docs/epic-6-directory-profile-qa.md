# Validación de directorio y perfiles

Rama: `fix/grupo-6-directory-profile-afix`.

## Alcance

- Una fuente de datos de demostración para las seis tarjetas y sus perfiles.
- Regreso al directorio mediante `/mentorship/mentors`.
- Consultas asíncronas con TanStack Query v5 y reintento manual.
- Estados de carga, directorio vacío, error y perfil inexistente.
- Páginas delgadas, vistas y hooks de cliente, y servicios del dominio separados.

El servicio temporal usa datos simulados. No consulta una API ni acredita aprobación, autenticación o disponibilidad real. La integración con backend permanece pendiente.
No se modifican la activación, la edición de áreas, la gestión de orientaciones ni el agendamiento.

## Prueba manual

Ejecutar el frontend con `pnpm dev`. Abrir las rutas en el puerto indicado por Next.js.

1. `/mentorship/mentors`: observar carga y después seis tarjetas.
2. Abrir cada perfil: nombre, cargo, áreas y disponibilidad deben coincidir con su tarjeta.
3. Pulsar «Volver al directorio»: debe regresar al listado sin error de ruta.
4. `/mentorship/mentors?demo=empty`: debe mostrar «No hay perfiles disponibles», sin tarjetas.
5. `/mentorship/mentors?demo=error`: debe mostrar error; «Reintentar» debe recuperar el listado.
6. `/mentors/1?demo=error`: debe mostrar error, reintento y regreso al directorio; el reintento debe recuperar a Ana Rojas.
7. `/mentors/999`: debe mostrar «Mentor no encontrado» y permitir regresar.
8. Repetir en móvil y escritorio; recorrer enlaces y botones con Tab y activarlos con Enter.

Los parámetros de demostración funcionan únicamente en desarrollo. El error se produce una vez por consulta y carga de página; para repetirlo, recargar la página. No se guarda ningún dato de negocio en localStorage.

## Verificaciones

- `pnpm lint`
- `pnpm test:coverage` (umbrales del repositorio sin reducir: 80 %)
- `pnpm build`

Relacionadas: #327, #328, #329, #330, #331, #332, #214, #216 y #218.
Las tareas fullstack no quedan completadas por esta implementación simulada.
