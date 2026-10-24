# Plantilla: mini-skill individual (copia/ajusta, NO sustituye skill madre)

Crear `.agents/skills/umssy-hu9-dev-<n>-<tarea>/SKILL.md`:

```markdown
---
name: umssy-hu9-dev-1-api
# Personalizar nombre y descripción; no usar nombres duplicados entre skills.
description: Desarrollar la issue #1424 de la HU-MEN-09 de UMSSY (API, filtros y paginación). Usar exclusivamente en esta issue y respetar la skill compartida umssy-hu9.
---

# Dev X — Issue #142X

## Heredar reglas
- Leer primero `.agents/skills/umssy-hu9/SKILL.md` y referencias de arquitectura, contrato API, catálogo de correspondencia Epic 2 → Epic 6 y QA.
- Esta mini-skill agrega procedimientos, pero nunca contradice la skill madre. No crear ni versionar `AGENTS.md` raíz. No cambiar el catálogo compartido sin revisión del equipo.

## Responsabilidad
- Issue asignada: #142X.
- Objetivo verificable: [copiar de la issue].
- Archivos bajo responsabilidad: [rutas específicas].
- Archivos ajenos que NO tocar sin coordinación: [rutas].
- Dependencias de otros devs: [contratos].

## Procedimiento
1. Confirmar rama y último commit del equipo.
2. Leer archivos relevantes antes de editar.
3. Implementar un cambio acotado; agregar pruebas.
4. Ejecutar comandos de validación apropiados.
5. Reportar archivos, criterios cubiertos, resultados, bloqueos y enlace PR.

## Validación
- [ ] Caso positivo.
- [ ] Caso límite / error.
- [ ] No se rompen funcionalidades existentes.
- [ ] Tests/lint/build apropiados.
```

**Importante:** desarrollar mini-skills en sus propias ramas; coordinar el momento de fusionarlas para evitar conflictos, y evitar que incluyan secretos o supuestas decisiones de QA no documentadas.
