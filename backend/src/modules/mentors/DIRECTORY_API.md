# Contrato local HU9-02: directorio paginado

`GET /api/mentors/directory` requiere JWT. La ruta anterior `GET /api/mentors` sigue devolviendo el arreglo original sin paginación. `GET /api/technical-areas` proporciona las opciones del filtro de área.

Parámetros URL: `page` es entero positivo (por defecto `1`); `search` es texto de hasta 100 caracteres, recortado (por defecto vacío); `area` es el nombre exacto de un área técnica (hasta 80 caracteres); `available` acepta únicamente `true` o `false` (por defecto `false`); `sort` acepta `name_asc` (por defecto), `name_desc` o `affinity`. Los dos últimos valores están reservados para HU9-07 y HU9-01 y actualmente devuelven HTTP 400 con un mensaje explícito. Parámetros desconocidos, incluido `pageSize`, devuelven HTTP 400.

El `ResponseInterceptor` envuelve el resultado una vez:

```json
{
  "statusCode": 200,
  "ok": true,
  "detail": "Operación exitosa",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 6,
    "totalItems": 0,
    "totalPages": 0,
    "effectiveSort": "name_asc"
  }
}
```

Cada elemento de `items` conserva los campos del directorio anterior: `id`, `fullName`, `headline`, `photoUrl`, `education`, `isAvailable`, `technicalAreas` y `orientationTypes`. El servidor filtra, ordena por `firstName`, `lastName` e `id` ascendentes, y después pagina. `totalItems` corresponde al conjunto filtrado. Una página mayor a `totalPages` se ajusta a la última; con cero resultados, `page=1` y `totalPages=0`.

La búsqueda admite términos distribuidos entre nombre, apellido, titular profesional y nombres de áreas técnicas. Es insensible a mayúsculas mediante el modo `insensitive` de Prisma/PostgreSQL. A diferencia del filtro previo en cliente, no elimina diacríticos: `Jose` podría no coincidir con `José`. Resolver esa equivalencia requiere una estrategia de base de datos acordada y probada; este endpoint no presupone la extensión `unaccent`.

`sharedInterestsCount` y `affinityStatus` pertenecen a HU9-01 y no se devuelven todavía. La propuesta de `.agents/skills/umssy-hu9/references/api-contract.md` sigue pendiente de aprobación entre desarrolladores; este documento describe únicamente lo implementado localmente. HU9-01 deberá usar la identidad del JWT, el catálogo aprobado de habilidades a áreas técnicas y un orden global previo a paginar, sin alterar el retorno de `GET /api/mentors`.
