# Adecuación a estándares de Épica 3

## Alcance

Revisión del código propio de radar, verificación de CV y sus puntos de integración. Se conserva la resolución de conflictos del PR #2482. Esta adecuación no certifica todos los dominios heredados de `develop` ni modifica historia compartida, esquema Prisma, migraciones o configuración de CI.

## Cambios

| Requisito | Resultado |
| --- | --- |
| Documentación por dominio | README de radar-chart, radar-integration, cv y mentorship con flujos, dependencias, API, Mermaid e historial de Sprint 3 |
| Documentación de BD | Diccionario de 95 modelos y 135 relaciones, con tipos, claves, mapas, índices y borrado |
| API documentada | 24 operaciones de radar con identificadores únicos, JWT, permisos, parámetros, cuerpos, respuestas, errores y ejemplos |
| Límites entre dominios | Roles consultados mediante UsersService; radar no lee directamente userRole |
| Frontend público | Consumo mediante index.ts y consulta de nombres de área sin inicialización circular |
| Contratos | Tipos y props individuales; sufijo .types.ts en contratos backend del módulo; respuesta real de reanálisis de CV |
| Lenguaje y UI | Identificadores internos en inglés, estados visuales sin semáforo, Label de UI y estilos estáticos Tailwind |
| Catálogos | Enums TypeScript para estados y tipos de fuente documentales, conservando valores persistidos |
| Seguridad y concurrencia | Pruebas de lease perdido, OCR fallido, certificado ajeno, tareas simultáneas y cambio de titular |

## Validación reproducible

Resultado local del 16 de noviembre de 2026:

| Alcance | Pruebas aprobadas | Sentencias | Ramas | Funciones | Líneas |
| --- | --- | --- | --- | --- | --- |
| Backend radar-integration | 147 | 86,73 % | 83,40 % | 80,06 % | 86,96 % |
| Frontend radar-chart y cv; integración con directorio | 622 | 87,44 % | 80,20 % | 82,39 % | 87,92 % |

Los límites siguen en 80 % para las cuatro métricas. TypeScript de frontend y compilación de producción del backend sin emisión pasaron; ESLint y Oxlint también pasaron mediante los hooks de los commits. La compilación Next con Webpack pasó, con una advertencia de `import.meta` en el módulo heredado de notificaciones. Estos resultados no certifican la cobertura global de otros dominios.

Desde `backend/`:

```text
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.build.json --incremental false
node node_modules/eslint/bin/eslint.js src/modules/radar-integration
node_modules/.bin/oxlint.cmd --type-aware src/modules/radar-integration/
node node_modules/vitest/vitest.mjs run src/modules/radar-integration --maxWorkers=2 --coverage --coverage.include=src/modules/radar-integration/**
```

Desde `frontend/`:

```text
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/modules/radar-chart src/modules/cv src/modules/mentorship/views/mentor-directory-view.tsx --max-warnings=0
node node_modules/vitest/vitest.mjs run src/modules/radar-chart src/modules/cv src/modules/mentorship/views/mentor-directory-view.test.tsx --maxWorkers=1 --coverage --coverage.include=src/modules/radar-chart/** --coverage.include=src/modules/cv/**
node node_modules/next/dist/bin/next build --webpack
```

Los filtros de cobertura delimitan esta adecuación; no excluyen código ejecutable de esos dominios ni reducen los umbrales de 80 % del repositorio. La cobertura global requiere ejecutar todas las suites. La ejecución simultánea de las suites completas localmente produjo timeouts en pruebas de disponibilidad, educación y reportes; no se cambiaron sus tests ni sus límites. La compilación Next requiere acceso a Google Fonts para Inter e Inter Tight.

## Pendientes de revisión por propietarios

- Base de Datos: [solicitud concreta](database-change-request.md). Las diferencias de claves, defaults, auditoría y catálogos de tablas heredadas siguen pendientes hasta que ese equipo apruebe e implemente la migración.
- Líder de Épica 3: revisar los cambios y su documentación antes de integrar.
- Integración previa: el PR #2482 debe fusionarse primero. Hasta entonces, un PR hacia Épica 3 también muestra los cambios de CODEOWNERS provenientes de develop y puede ser bloqueado por CI Files. Los commits nuevos de estándares no modifican esos archivos ni usan nombres de rama DevOps para eludir esa revisión.
- DevOps: aprobar la futura integración de Épica 3 hacia develop. Los commits históricos en español no se reescriben; los nuevos commits usan inglés y Conventional Commits.
