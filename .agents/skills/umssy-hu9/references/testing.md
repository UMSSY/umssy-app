# Estrategia de pruebas — HU-MEN-09

## Pruebas por capa

### Backend (Vitest)
- Tests de validación de query y HTTP controlado; `name_asc`, `name_desc`, `affinity`.
- Repository/Service: filtrar **antes** de paginar; total filtrado; límites 18/20/0; página fuera de rango; IDs distintos.
- Seguridad: afinidad utiliza identidad JWT; sin habilidades → sin fallo; con habilidades sin correspondencia → respuesta diferenciada; varias habilidades traducidas a una misma área → contar 1; caso sin coincidencias; áreas únicas y desempate estable.
- Performance: sin consultas N+1 por mentor; no cargar imágenes binarias masivas en endpoints de listado.

### Frontend (Vitest + Testing Library)
- Selector A–Z inicial, Z–A, afinidad activo y vuelta a general; feedback sin habilidades.
- `MentorCard` conserva foto/estado/áreas/acciones; badge condicional y singular/plural razonable.
- Paginador: 1, 3, 4 y 5 páginas; botones límites, tres números visibles, contador rango, vacío.
- QueryKey contiene los parámetros efectivos; cambio de sort o filtro restablece página 1.
- Preservación URL (F5), parámetros normalizados y retorno seguro desde perfil.

### E2E (Playwright de revisión)
- 18/20 mentores, filtros cruzados, afinidad por catálogo Epic 2 → Epic 6, Z–A, 3 números móviles.
- Recorrido con IDs únicos en todas las páginas; búsqueda/acento; disponibilidad; perfil y volver; recarga.
- Medición de tiempo inferior a 3 s bajo entorno definido; viewport móvil para **controles nuevos**.
- Pruebas de regresión de HU01/HU02 relevantes al directorio.

## Comandos reales del repositorio

```powershell
# En /backend
pnpm lint
pnpm lint:standards
pnpm test
pnpm test:cov
pnpm build

# En /frontend
pnpm lint
pnpm test
pnpm test:coverage
pnpm build
```

En desarrollo puede ejecutarse un test focalizado primero, pero **antes del PR ejecutar las verificaciones que aplica GitHub Actions**. Si no se puede, declararlo claramente; no alterar CI, linter o tests.

## Automatización externa disponible en el equipo

Hay una carpeta de Playwright de regresión fuera del repositorio (`umssy-qa-tests`). No asumir que forma parte de `umssy-app`; si está disponible, ejecutar sus escenarios orientados a HU01/HU02/HU9 contra la instancia local. Una prueba exitosa no sustituye comprobación de criterios no automatizados.

## Formato de reporte por issue

```text
Issue: #142X · HU9-0X
Rama / base: ...
Archivos cambiados: ...
Criterios cubiertos: AC ...
Pruebas ejecutadas: comando -> PASA/FALLA/NO EJECUTADA
Compatibilidad: comprobada / pendiente
Bloqueos y riesgos: ...
PR hacia epic/grupo-6-red-mentorias: URL o pendiente
```

Nunca marcar como `PASA` un test que no se corrió o cuyo entorno falló antes de llegar a la aserción.
