# Contrato local HU9-02: directorio paginado

`GET /api/mentors/directory` requiere JWT. La ruta anterior `GET /api/mentors` sigue devolviendo el arreglo original sin paginación. `GET /api/technical-areas` proporciona las opciones del filtro de área.

Parámetros URL: `page` es entero positivo (por defecto `1`); `search` es texto de hasta 100 caracteres, recortado (por defecto vacío); `area` es el nombre exacto de un área técnica (hasta 80 caracteres); `orientation` es opcional y recibe el nombre exacto de un tipo de orientación activo, recortado y de hasta 80 caracteres; `available` acepta únicamente `true` o `false` (por defecto `false`); `sort` acepta `name_asc` (por defecto), `name_desc` o `affinity`. Los dos últimos valores están reservados para HU9-07 y HU9-01 y actualmente devuelven HTTP 400 con un mensaje explícito. Parámetros desconocidos, incluido `pageSize`, devuelven HTTP 400.

Los filtros `search`, `area`, `orientation` y `available` se combinan con lógica AND. Cuando se envía `orientation`, el directorio incluye únicamente mentores asociados a ese tipo de orientación. Un nombre de orientación inexistente produce un conjunto vacío (`totalItems=0`, `totalPages=0`) y no genera un error.

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

La búsqueda `search` se limita a `firstName` y `lastName`. Cada palabra se compara de forma parcial e insensible a mayúsculas mediante el modo `insensitive` de Prisma/PostgreSQL; por ello se admiten nombre, apellido o varias palabras en cualquier orden. El titular profesional y las áreas técnicas no participan en `search`; el área se filtra exclusivamente mediante `area`. Una cadena formada solo por espacios se recorta y equivale a una búsqueda vacía.

Respecto a tildes, esta implementación conserva el comportamiento actual de PostgreSQL/Prisma y no elimina diacríticos: `Jose` podría no coincidir con `José`. No se presupone ni habilita `unaccent`. La ratificación de esta decisión por el equipo Database debe quedar registrada antes de considerar cerrado el criterio de aceptación de HU-MEN-08 relativo a tildes.

`sharedInterestsCount` y `affinityStatus` pertenecen a HU9-01 y no se devuelven todavía. La propuesta de `.agents/skills/umssy-hu9/references/api-contract.md` sigue pendiente de aprobación entre desarrolladores; este documento describe únicamente lo implementado localmente. HU9-01 deberá usar la identidad del JWT, el catálogo aprobado de habilidades a áreas técnicas y un orden global previo a paginar, sin alterar el retorno de `GET /api/mentors`.
