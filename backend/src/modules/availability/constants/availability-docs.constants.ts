export const FIND_MY_BLOCKS_DOCS = {
  summary: 'Lista los bloques de disponibilidad del mentor en sesión dentro de un rango de hasta 7 días',
  fromDescription: 'Inicio del rango en ISO 8601 UTC (por ejemplo, lunes 00:00 de Bolivia = 04:00Z)',
  toDescription: 'Fin del rango en ISO 8601 UTC; como máximo 7 días después de from',
} as const;

export const FIND_MENTOR_FREE_BLOCKS_DOCS = {
  summary:
    'Lista los bloques libres de un mentor dentro de un rango de hasta 7 días: sin bloques pasados ni con cita pendiente o confirmada',
  idDescription: 'Identificador (UUID) del mentor',
  fromDescription: FIND_MY_BLOCKS_DOCS.fromDescription,
  toDescription: FIND_MY_BLOCKS_DOCS.toDescription,
} as const;

export const DELETE_BLOCK_DOCS = {
  summary: 'Elimina un bloque de disponibilidad del mentor en sesión',
  description: 'Borra el bloque; si tiene citas activas asociadas responde con 409',
  idDescription: 'UUID del bloque a eliminar',
} as const;

export const UPDATE_BLOCK_DOCS = {
  summary: 'Edita un bloque de disponibilidad propio que no tenga citas pendientes o confirmadas',
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
