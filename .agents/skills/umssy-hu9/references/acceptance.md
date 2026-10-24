# HU-MEN-09 — matriz de criterios y trazabilidad

Fuente principal: [issue #1388](https://github.com/UMSSY/umssy-app/issues/1388), 22 criterios a 24/10/2026. El lenguaje original alude a botón de afinidad; el mockup acordado y las issues #1425/#1429 implementan selector de **tres opciones**. No sustituir silenciosamente criterios oficiales sin QA.

| Nº | Comprobación verificable | Issues |
|---:|---|---|
| 1 | Afinidad solicitada: el mentor con más coincidencias aparece primero | #1423 #1428 |
| 2 | Ejemplo Backend+Cloud: A=2, B=1, C=0 → A, B, C; requiere fuente comparable | #1423 |
| 3 | Sin habilidades del egresado, el directorio sigue disponible en orden general | #1423 #1425 |
| 4 | 18 mentores: 6 en primera página, 3 páginas, `Mostrando 1–6 de 18 mentores` | #1424 #1426 |
| 5 | Anterior/Siguiente/número cambian al conjunto correcto de tarjetas | #1426 #1428 |
| 6 | Con filtro Backend+afinidad, cambio de página conserva ambos y solo muestra Backend | #1424 #1427 #1428 |
| 7 | Desde página 2 + Backend + afinidad, abrir perfil y volver restaura todo | #1427 #1428 |
| 8 | Al entrar, afinidad no está activada (selector A–Z predeterminado) | #1425 |
| 9 | Sin afinidad, se usa orden general A–Z | #1424 #1425 |
| 10 | Activar afinidad produce estado visual claramente distinto | #1425 |
| 11 | Desactivar afinidad retorna al orden general A–Z | #1425 |
| 12 | Sin coincidencias, mostrar todos los mentores en orden general | #1423 #1428 |
| 13 | Anterior deshabilitado en página 1 | #1426 |
| 14 | Siguiente deshabilitado en última página | #1426 |
| 15 | Con 20 mentores, página 4 contiene 2 y `Mostrando 19–20 de 20 mentores` | #1424 #1426 |
| 16 | Recorrer páginas de 18 muestra 18 IDs distintos sin duplicados | #1424 #1428 |
| 17 | Selector y paginador nuevos completos, visibles y operables en móvil/escritorio | #1425 #1426 |
| 18 | Cambiar página/orden responde con tarjetas visibles en menos de 3 s | #1428 |
| 19 | Color/estilo distingue estado de afinidad activo | #1425 |
| 20 | F5 en página 2 mantiene `Mostrando 7–12 de 18 mentores` y afinidad | #1427 #1428 |
| 21 | Tarjetas muestran `N intereses en común` con afinidad activa | #1423 #1425 |
| 22 | Si no hay habilidades/intereses, activar afinidad da mensaje para agregarlos y listado general | #1423 #1425 |

## Reglas adicionales del mockup/issues aprobadas para implementación

- Tres opciones: Nombre (A–Z), Nombre (Z–A), Mayor afinidad. **Z–A necesita criterios propios oficiales de QA todavía pendientes.**
- Título `Sugerencias` en modo general y `Preferencias` con afinidad, según mockup.
- Paginación: ventana móvil de tres números; página 4 de 5 muestra `3 4 5`.
- Conservar estilo original de `MentorCard`, incorporando solo indicador condicional.
- Paginación/ordenamiento después de filtrar en todo el conjunto, nunca dentro de una página.

## Regresión HU01/HU02 que HU9 debe vigilar

- HU-MEN-01: búsqueda, área, disponibilidad, estado vacío, error/reintento, carga, tarjetas, accesibilidad de controles existentes.
- HU-MEN-02 AC-02.3: volver al directorio conserva filtros. Fallaba antes de HU9; HU9-05 debe resolverlo.
- Defectos responsivos generales del layout y del perfil detectados previamente se registraron aparte. **No expandir HU9 para rediseñar esas pantallas**; sí asegurar responsive de selector/paginador nuevos.

## Resultados de demostración mínimos

| Situación | Resultado |
|---|---|
| 18 mentores | páginas 1–3, 6 por página, sin IDs repetidos |
| 20 mentores | página 4 con 2 tarjetas |
| 25 mentores | 5 páginas, página 4: controles `3 4 5` |
| 0 mentores | estado vacío, sin paginador confuso |
| Backend + afinidad + página 2 | solo Backend; permanece selección y orden |
| Perfil → retorno | misma página, búsqueda, área, disponibilidad y sort |
| Sin habilidades del egresado | mensaje y directorio normal |
| Sin coincidencias | no desaparece ningún mentor |
| Z–A | orden global descendente, no inversión local de seis registros |

Los casos de rendimiento deben indicar condiciones: backend local/staging, cantidad de resultados, navegador, CPU/red y si se midió desde el evento hasta pintar tarjetas.
