# Contrato de integración — PROPUESTA para acordar entre los 3 devs

**Estado: POR APROBAR EN EL EQUIPO.** Este archivo no representa un endpoint ya implementado ni un contrato autorizado por QA. Dev 1 debe confirmar el diseño con Dev 2 y Dev 3 **antes de empezar a cambiar clientes o endpoints**; una vez acordado, editar este archivo en un solo PR coordinado.

## Compatibilidad

- Conservar `GET /api/mentors` como lista existente `ApiResponse<MentorDirectoryItem[]>` de A–Z, para no romper consumidores previos.
- Propuesta: añadir `GET /api/mentors/directory` como ruta protegida por JWT para búsqueda/orden/paginación y afinidad del usuario autenticado. Declararla antes de `@Get(':userId')`; mantener `ResponseInterceptor`.
- El directorio del frontend autenticado consumirá la nueva ruta. No introducir regresiones al perfil ni fotos.

## Entrada (nombres y tipos propuestos)

| Parámetro URL | Ejemplo | Regla |
|---|---|---|
| `page` | `2` | Entero 1-indexado, defecto 1 |
| `search` | `hugo` | Texto opcional, búsqueda con normalización coherente con `normalizeSearch` actual |
| `area` | `Backend` | Nombre exacto de área presente en catálogo; valor URL-encoded |
| `available` | `true` | `true` o `false`, defecto `false` |
| `sort` | `name_asc` | `name_asc` (defecto), `name_desc`, `affinity` |

El tamaño es **siempre 6**, impuesto por servidor (no confiar en `pageSize` manipulable). Parámetros inválidos deben producir respuesta controlada; si `page` queda fuera de rango al variar filtros, normalizar al último válido (o 1 si no existen resultados) y mantener la URL sincronizada. Documentar la regla final y probarla.

Ejemplo:

```http
GET /api/mentors/directory?page=2&area=Backend&available=true&sort=affinity
Authorization: Bearer <access-token>
```

## Salida propuesta

La capa de respuesta existente envuelve el retorno en `ApiResponse<T>`, por lo que el Service debería producir solo el objeto `data` de esta forma:

```ts
export type MentorSort = 'name_asc' | 'name_desc' | 'affinity';

export interface DirectoryPage {
  items: Array<MentorDirectoryItem & { sharedInterestsCount: number }>;
  page: number;
  pageSize: 6;
  totalItems: number;
  totalPages: number;
  affinityStatus: 'ready' | 'no_skills' | 'unmapped_skills';
  effectiveSort: MentorSort;
}
```

`ApiResponse<DirectoryPage>` es la respuesta HTTP resultante; no envolver manualmente dos veces. Los nombres `sharedInterestsCount`, `affinityStatus` y `effectiveSort` deben aprobarse y **coincidir literalmente** entre frontend, backend y tests.

- `totalItems` cuenta los mentores **después de aplicar todos los filtros**, pero antes de paginar.
- `totalPages = ceil(totalItems / 6)`; si no hay resultados, definir explícitamente `totalPages=0` o `1` y que frontend lo gestione con coherencia (recomendación: 0 y ocultar paginador).
- El `sharedInterestsCount` representa **cantidad de áreas técnicas únicas en común** tras aplicar el catálogo Epic 2 → Epic 6 (no la cantidad bruta de habilidades compartidas); debe venir del servidor y no calcularse en el cliente.
- Si el usuario pide afinidad sin habilidades de Epic 2: lista A–Z, `affinityStatus=no_skills`, `effectiveSort=name_asc` y mensaje en frontend. Si tiene habilidades pero ninguna equivale a un área mapeada: `affinityStatus=unmapped_skills`, orden A–Z y mensaje específico. Con áreas mapeadas: `ready`, incluso si todos los mentores puntúan cero.
- Si usuario tiene habilidades pero ningún mentor coincide: todos los mentores, A–Z en caso de empate 0; definir con QA si selector permanece visualmente activo. No excluir resultados.

## Orden de operaciones

1. Determinar rol mentor activo y aplicar filtros de texto, área y disponibilidad sobre el conjunto completo.
2. Si sort=affinity: cargar `UserSkill`/`Skill` del usuario JWT, traducir al catálogo de `TechnicalArea` aprobado, cargar en lote `MentorTechnicalArea` de mentores filtrados y calcular **áreas compartidas únicas**, sin N+1. Ver `affinity-decisions.md` y `skill-area-catalog.md`.
3. Orden global: nombre asc; nombre desc; afinidad desc y empates nombre asc + `id` (determinista).
4. Contar total, resolver página válida, extraer máximo seis.
5. Devolver datos del perfil visual + metadatos y indicador de coincidencias.

## Fuente del filtro de área

Usar el catálogo `GET /api/technical-areas`, o devolver un campo `facets` definido de común acuerdo. **No derivar opciones de la página de seis resultados**, porque impediría elegir áreas de páginas distintas.

## Persistencia URL

El estado canónico del directorio debe estar en sus query params: `page`, `search`, `area`, `available`, `sort`. Ejemplo:

`/mentorship/mentors?page=2&area=Backend&sort=affinity`

- Cambiar página conserva demás valores.
- Cambiar filtro/orden restablece `page=1`.
- Crear enlace de perfil con parámetro de retorno seguro (`returnTo` o equivalente acordado). **Validar que el retorno sea ruta interna**; no abrir redirects externos ni hacer decodificaciones arbitrarias.
- `Volver al directorio` devuelve el estado canónico. Evitar exclusivamente `router.back()` porque tras F5 o compartir link puede no existir historial apropiado.
- No almacenar filtros duplicados en un contexto global y en URL sin sincronización definida.

## Pruebas mínimas del contrato

18 → 3×6; 20 → 6+6+6+2; 0 → estado vacío; filtro Backend en todas las páginas; búsqueda sin tildes; `available=true`; 25 mentores y página fuera de rango; IDs sin repetir; `name_desc` global antes de pagina; afinidad por catálogo 2–1–0; varias habilidades hacia la misma área = 1; cero habilidades; habilidades no mapeadas; sin coincidencias; retorno y F5.
