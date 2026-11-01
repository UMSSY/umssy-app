import { MAX_REPEAT_WEEKS } from './create-block.constants.js';

export const CREATE_BLOCK_DOCS = {
  summary: 'Crea un bloque de disponibilidad o una serie semanal del mentor en sesión',
  description: `repeatWeekly=true requiere repeatUntil (YYYY-MM-DD), inclusivo entre la fecha del bloque en Bolivia y ${MAX_REPEAT_WEEKS} semanas después (hasta ${MAX_REPEAT_WEEKS + 1} ocurrencias). Conserva horario y duración; omite solapamientos y fechas bloqueadas. Sin repetición conserva la respuesta individual. Editar o eliminar afecta solo al bloque seleccionado.`,
  createdResponse:
    'Bloque individual o resultado de repetición { created: number, skipped: string[] } dentro de data. Las fechas omitidas usan YYYY-MM-DD en Bolivia; incluso si todas se omiten responde 201.',
  badRequestResponse: `Horario inválido, repeatUntil inválido, ausente al repetir o fuera del rango de ${MAX_REPEAT_WEEKS} semanas, o repeatUntil sin repeatWeekly=true.`,
} as const;

export const FIND_MY_BLOCKS_DOCS = {
  summary: 'Lista los bloques de disponibilidad del mentor en sesión dentro de un rango de hasta 7 días',
  fromDescription: 'Inicio del rango en ISO 8601 UTC (por ejemplo, lunes 00:00 de Bolivia = 04:00Z)',
  toDescription: 'Fin del rango en ISO 8601 UTC; como máximo 7 días después de from',
  description:
    'Los bloques con cita confirmada incluyen appointment con el nombre de quien reservó y el tema; los libres traen appointment en null',
} as const;

export const FIND_MENTOR_FREE_BLOCKS_DOCS = {
  summary:
    'Lista los bloques libres de un mentor dentro de un rango de hasta 7 días: sin bloques pasados ni con cita confirmada',
  idDescription: 'Identificador (UUID) del mentor',
  fromDescription: FIND_MY_BLOCKS_DOCS.fromDescription,
  toDescription: FIND_MY_BLOCKS_DOCS.toDescription,
  description: 'Tampoco devuelve los bloques de los días que el mentor bloqueó',
} as const;

export const DELETE_BLOCK_DOCS = {
  summary: 'Elimina un bloque de disponibilidad del mentor en sesión',
  description: 'Borra el bloque; si tiene citas activas asociadas responde con 409',
  idDescription: 'UUID del bloque a eliminar',
} as const;

export const UPDATE_BLOCK_DOCS = {
  summary: 'Edita un bloque de disponibilidad propio que no tenga citas confirmadas',
  idDescription: 'ID del bloque de disponibilidad a editar',
} as const;

export const FIND_MY_AVAILABILITY_STATUS_DOCS = {
  summary: 'Indica si el mentor en sesión está recibiendo solicitudes de mentoría',
} as const;

export const UPDATE_AVAILABILITY_STATUS_DOCS = {
  summary: 'Activa o pausa la recepción de solicitudes de mentoría del mentor en sesión',
  description:
    'Solo cambia isAvailableForMentoring (servicio de Epic 6): no modifica citas confirmadas ni fechas bloqueadas. Responde 403 si el id no es el del mentor en sesión',
  idDescription: 'Identificador (UUID) del mentor en sesión',
} as const;

export const BLOCK_DATE_DOCS = {
  summary: 'Bloquea una fecha del mentor en sesión: sus horarios dejan de ofrecerse sin borrar los bloques',
  description:
    'blockedOn en AAAA-MM-DD (hora de Bolivia) desde hoy y reason opcional de hasta 100 caracteres. Si la fecha ya estaba bloqueada devuelve el bloqueo existente. Responde 400 si la fecha ya pasó y 409 si el día tiene una cita confirmada',
} as const;

export const UNBLOCK_DATE_DOCS = {
  summary: 'Desbloquea una fecha del mentor en sesión; sus bloques libres vuelven a ofrecerse',
  idDescription: 'UUID de la fecha bloqueada',
} as const;

export const FIND_BLOCKED_DATES_DOCS = {
  summary: 'Lista las fechas bloqueadas del mentor en sesión desde una fecha o dentro de un rango de hasta 7 días',
  fromDescription: FIND_MY_BLOCKS_DOCS.fromDescription,
  toDescription: `${FIND_MY_BLOCKS_DOCS.toDescription}. Opcional: sin este parámetro se incluyen todas las fechas desde from`,
} as const;
