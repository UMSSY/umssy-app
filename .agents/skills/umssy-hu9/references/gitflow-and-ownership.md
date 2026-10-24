# Integración, propiedad de archivos y trabajo paralelo

## Fuentes

Reglas verificadas en `.github/workflows/pr-standards.yml`, `scripts/check-branch-name.sh`, `.github/CODEOWNERS`, `ci-backend.yml`, `ci-frontend.yml` del commit de `develop` citado en `architecture.md`.

## Branches y PR

Ramas de grupo aceptadas: `feature/grupo-6-<descripcion>`, `fix/grupo-6-<descripcion>`, `test/grupo-6-<descripcion>` (sin mayúsculas, espacios ni `_`). PR desde esas ramas a `epic/grupo-6-red-mentorias` y de la Epic a `develop`. Prohibido PR directo de tarea a `develop`.

**Ejemplos:**

- `feature/grupo-6-hu9-api-pagination`
- `feature/grupo-6-hu9-affinity`
- `feature/grupo-6-hu9-sort-selector`
- `feature/grupo-6-hu9-paginator`
- `feature/grupo-6-hu9-url-state`
- `feature/grupo-6-hu9-sort-desc`
- `feature/grupo-6-hu9-integration`

Commits: `feat(mentors): implement stable directory pagination`, `test(mentors): cover affinity sorting`, etc. Verificar validación exacta de commits en CI antes de abrir PR.

## Titularidad orientativa

| Dev | Tareas | Archivos que probablemente toca |
|---|---|---|
| 1 Backend | #1424 #1423 | `backend/src/modules/mentors/{controllers,services,repositories,mappers,requests,tests}` |
| 2 Frontend | #1425 #1426 | `frontend/src/modules/mentorship/components/mentor/`, componente nuevo de selector/paginador, tipos/tests |
| 3 Fullstack | #1427 #1429 #1428 | navegación y hooks frontend, integración de servicios y tipos, Z–A en backend **coordinado** con Dev 1 |

**Conflictos previsibles:** `mentor-directory-view.tsx` Dev 2/3, `mentors.repository.ts` Dev 1/3, `mentor-directory.service.ts` Dev 3 y posible Dev 2. Evitar editar concurrentemente los mismos archivos. Preferir componentes/hook aislados y dejar el cableado central a integración.

## Plan de dos días (estimación, no garantía)

Total: 30 horas-persona entre tres desarrolladores.
- Dev 1: #1424 4 h + #1423 6 h = 10 h.
- Dev 2: #1425 5 h + #1426 4 h = 9 h.
- Dev 3: #1427 3 h + #1429 3 h + #1428 5 h = 11 h.

La integración puede comenzar gradualmente cuando se acepten contratos. **No iniciar #1428 como PR final hasta que las seis dependencias necesarias estén disponibles y verificables.**

## Mini-skills de desarrolladores

Cada integrante crea su mini-skill **en una subcarpeta distinta** de `.agents/skills/`, con nombre único y una sola responsabilidad (preferiblemente una issue o un grupo coherente). Debe comenzar por: «leer primero `umssy-hu9` y referencias aplicables; no sobreescribir decisiones compartidas». Usar plantilla `../assets/dev-skill-template.md` (relativa a `SKILL.md`, la ruta real es `.agents/skills/umssy-hu9/assets/dev-skill-template.md`).

## Protección del repositorio

CI restringe cambios a `.github/`, `.husky/`, `scripts/`, `backend/scripts/`, `backend/package.json`, `frontend/package.json`, y archivos de configuración/lint/test específicos. No tocar estos archivos en PRs de HU9; requerir procedimiento DevOps si fueran necesarios.

No ejecutar comandos destructivos (`git reset --hard`, `git clean -fd`, `docker compose down -v`, truncar BD, borrar volúmenes) sin instrucción inequívoca y evaluación de riesgos.
