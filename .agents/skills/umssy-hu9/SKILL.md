---
name: umssy-hu9
description: >-
  Implementar, revisar e integrar la HU-MEN-09 de UMSSY (Epic 6): directorio de mentores,
  API paginada, filtros, afinidad con habilidades del perfil, orden A–Z/Z–A, selector,
  contador, retorno desde perfil, persistencia URL y pruebas. Usar al trabajar en las
  issues #1423–#1429 o al verificar sus criterios de QA. No usar para otras épicas.
metadata:
  version: "1.1.0"
  scope: "UMSSY Epic 6 / HU-MEN-09"
---

# UMSSY · HU-MEN-09 — skill compartida del equipo

## Objetivo

Entregar ordenamiento y paginación del directorio de mentores **sin romper la HU01/HU02 existentes**. Aplicar los **22 criterios actualmente documentados** en la issue principal [#1388](https://github.com/UMSSY/umssy-app/issues/1388), las issues de ejecución [#1423–#1429] y los acuerdos sobre el selector de tres opciones. Los criterios oficiales del orden Z–A aún están pendientes de QA.

Esta skill es **la base común solo de HU9**, no una política general de Epic 6 ni de todo UMSSY. No requiere `AGENTS.md` raíz. **Las instrucciones de `SKILL.md` se deben activar explícitamente** cuando el asistente no las detecte automáticamente.

Esta skill es **la base común**. Una mini-skill por desarrollador puede especializar pasos para su issue, pero no puede reemplazar ni contradecir el contrato acordado, QA, seguridad, GitFlow ni las reglas de esta skill.

## Secuencia obligatoria por issue

1. **Situación:** comprobar `git status -sb`, rama actual, issue asignada y cambios recientes de la rama Epic 6. **Este paquete no incluye ni exige un `AGENTS.md` raíz**: todas las reglas compartidas de HU9 están en esta skill. No generar ni versionar un `AGENTS.md` global como parte de las issues de HU9.
2. **Contexto:** inspeccionar archivos concretos antes de proponer código. Usar `references/architecture.md` para localizar componentes y servicios; no inferir la estructura desde otros proyectos.
3. **Contrato:** para cambios de API, URL, estado o afinidad, leer `references/api-contract.md`, `references/affinity-decisions.md` y `references/skill-area-catalog.md`. Respetar el acuerdo de combinar habilidades profesionales de Epic 2 con áreas técnicas de Mentorías mediante catálogo explícito; no inventar equivalencias.
4. **Criterios:** identificar los casos aplicables en `references/acceptance.md` y en la issue de GitHub. Si difieren, no borrar silenciosamente un criterio; registrar la discrepancia y usar lo confirmado por QA/PO.
5. **Implementación:** cambios pequeños y enfocados; aplicar filtros antes de ordenar y paginar; preservar la estructura visual de `MentorCard`.
6. **Verificación:** escribir o actualizar pruebas de los casos tocados; leer `references/testing.md`; ejecutar lint/build relevantes. No afirmar éxito si una prueba no se corrió.
7. **Entrega:** responder con resumen, contrato afectado, resultados de pruebas y riesgos. Preparar PR hacia `epic/grupo-6-red-mentorias` con Conventional Commits.

## Reglas de repositorio incorporadas (sin AGENTS.md global)

- Trabajar desde la rama de tarea `feature/grupo-6-*` o `fix/grupo-6-*`, hacer PR **hacia `epic/grupo-6-red-mentorias`**, usar Conventional Commits y comprobar `git status` antes de editar.
- Reutilizar arquitectura actual (NestJS Controller → Service → Repository/Mapper; Next.js View → Hook → Service → ApiClient; Prisma y TanStack Query). No duplicar funciones ni introducir nuevas dependencias o migraciones por comodidad.
- Los controles del repositorio reservan cambios en `.github/`, `.husky/`, `scripts/`, `backend/scripts/`, `backend/package.json`, `frontend/package.json` y determinadas configuraciones de CI/lint/test. No modificarlos desde una rama de grupo; coordinar con DevOps.
- No versionar contraseñas, `.env`, credenciales de prueba fuera de documentación segura, tokens o datos personales. Nunca desactivar seguridad, pruebas o validaciones para lograr un resultado artificial.
- Hacer cambios mínimos por issue; no rediseñar otras HU, no sobrescribir cambios ajenos y no afirmar que las pruebas pasaron si no se ejecutaron.
- **No introducir ni versionar un `AGENTS.md` raíz para HU9.** La skill oficial es `.agents/skills/umssy-hu9/`; las mini-skills de desarrollador deben vivir en sus propias carpetas `.agents/skills/`.
- El archivo `.agents/skills/umssy-hu9/` puede proponerse por PR para la rama Epic; aprobar su entrada a `develop` con los responsables. Estas instrucciones no implican que CI las valide automáticamente.

## Comportamientos no negociables de HU9

- Orden inicial: **Nombre (A–Z)**. Opciones aprobadas en el mockup: **Nombre (A–Z)**, **Nombre (Z–A)**, **Mayor afinidad**. Los textos anteriores de QA describen un botón; no eliminar criterios funcionales por este cambio visual.
- El servidor debe aplicar **filtros → ordenamiento global → paginación**. Máximo **6 mentores por página**. Nunca ordenar solamente las 6 tarjetas visibles.
- Orden estable y total: además de nombre/apellido o coincidencias, desempatar por ID para evitar duplicados/omisiones entre páginas.
- Coincidencias: convertir habilidades profesionales (`UserSkill` → `Skill`) del egresado a áreas técnicas oficiales mediante un catálogo explícito y versionado, e intersectarlas con las áreas configuradas por cada mentor (`MentorTechnicalArea` → `TechnicalArea`). **Contar áreas compartidas únicas**, no habilidades individuales ni coincidencias de texto libre; si no hay coincidencias, conservar TODOS los mentores en orden general, sin ocultarlos.
- Si el usuario no tiene habilidades profesionales de Epic 2, permitir navegar el directorio; al pedir afinidad, explicar que debe registrarlas. Si tiene habilidades pero ninguna está mapeada por el catálogo, distinguir ese caso del perfil vacío y conservar el directorio sin inventar coincidencias.
- Persistir **búsqueda, área, disponibilidad, tipo de orden y número de página** al paginar, recargar F5, entrar a un perfil y usar «Volver al directorio». Reiniciar a página 1 al cambiar filtros/orden que alteren resultados.
- Contador esperado, entre otros: `Mostrando 1–6 de 18 mentores`, `Mostrando 7–12 de 18 mentores`, `Mostrando 19–20 de 20 mentores`. Anterior inactivo en primera, Siguiente inactivo en última, no repetir mentores.
- Paginador con ventana móvil de hasta **3 números** (ejemplo aprobado: página 4 de 5 → `3 4 5`). Compatibilidad desktop/móvil de **los controles nuevos**.
- Badge `N intereses en común` únicamente cuando corresponda al ordenamiento por afinidad; no cambiar colores, estructura ni información existente de `MentorCard` salvo lo imprescindible.
- Objetivo de respuesta: tarjetas visibles en menos de 3 segundos bajo condiciones de prueba definidas; medir, no prometer.

## Decisiones pendientes que NO debes suplir con conjeturas

1. **Afinidad definida para HU9:** usar **habilidades profesionales de Epic 2** (`UserSkill` → `Skill`) traducidas a **áreas técnicas de mentoría** mediante un catálogo explícito; comparar con `MentorTechnicalArea`. **No implementar por defecto intersección `UserSkill`↔`UserSkill` ni usar `Skill.areaId` como `TechnicalArea.id`**. La lista precisa de correspondencias debe ser revisada por equipo/QA antes de construir HU9-01. Ver `references/affinity-decisions.md` y `references/skill-area-catalog.md`.
2. **Contrato nuevo de API:** existe una propuesta concreta en `references/api-contract.md`, pero **debe acordarse al inicio entre Dev 1, 2 y 3**. No crear una respuesta incompatible unilateralmente.
3. **Z–A:** los criterios propios de QA están pendientes. Implementar los técnicos de #1429 sin afirmar que los criterios oficiales ya se recibieron.
4. **UI/QA:** si el texto original menciona botón de afinidad y el mockup selector de tres opciones, conservar comportamiento, comunicar diferencia y documentar aprobación.

## Enrutamiento según issue

| Issue | Dueño acordado | Instrucción adicional |
|---|---|---|
| [#1424](https://github.com/UMSSY/umssy-app/issues/1424) HU9-02 | Dev 1 | API, filtros, orden A–Z, seis por página, contrato compatible |
| [#1423](https://github.com/UMSSY/umssy-app/issues/1423) HU9-01 | Dev 1 | Afinidad real, deduplicación, empates, ausencia de datos, tests |
| [#1425](https://github.com/UMSSY/umssy-app/issues/1425) HU9-03 | Dev 2 | Selector, encabezados, badges, estado visual; mocks inicialmente |
| [#1426](https://github.com/UMSSY/umssy-app/issues/1426) HU9-04 | Dev 2 | Paginador, contador, estados extremos, tres números visibles |
| [#1427](https://github.com/UMSSY/umssy-app/issues/1427) HU9-05 | Dev 3 | Estado en URL y retorno desde perfil, F5; cubre regresión AC-02.3 |
| [#1429](https://github.com/UMSSY/umssy-app/issues/1429) HU9-07 | Dev 3 | Orden Z–A global con desempate, sin invadir el trabajo backend de Dev 1 |
| [#1428](https://github.com/UMSSY/umssy-app/issues/1428) HU9-06 | Dev 3 | Integración final, pruebas E2E, rendimiento y no regresiones |

## Coordinación paralela

- Antes de arrancar, fijar por escrito: ruta API, parámetros, forma de la respuesta, catálogo de correspondencia Epic 2 → área técnica, comportamiento con 0 habilidades/sin mapa y fuentes para el filtro Área.
- Dev 2 puede construir selector y paginador con mocks **tipados igual que el contrato**, sin esperar al backend.
- Dev 3 puede desarrollar URL/retorno aislados, pero coordinar los cambios en `mentor-directory-view.tsx`; dejar Z–A backend para después de la interfaz/API acordada.
- Una mini-skill individual debe leer esta skill primero y tocar solo los archivos asignados o acordados. Usar `assets/dev-skill-template.md` como patrón.
- Integrar incrementalmente en PR pequeños; no acumular los siete cambios sin revisiones.

## Referencias (leer solo según necesidad)

- `references/architecture.md` — rutas reales, convenciones y puntos de integración.
- `references/api-contract.md` — contrato **propuesto** para consensuar al inicio.
- `references/affinity-decisions.md` — algoritmo acordado, bordes y reglas de conteo.
- `references/skill-area-catalog.md` — propuesta verificable de equivalencias de habilidades profesionales de Epic 2 con áreas de Mentorías; no confundir ejemplos con catálogo aprobado.
- `references/acceptance.md` — matriz completa de los 22 criterios y escenarios Z–A pendientes.
- `references/testing.md` — unitarias, integración, Playwright, regresiones y comandos CI.
- `references/gitflow-and-ownership.md` — ramas, conflictos de archivos, límites, entregas.
- `assets/dev-skill-template.md` — plantilla para skills individuales por issue.
