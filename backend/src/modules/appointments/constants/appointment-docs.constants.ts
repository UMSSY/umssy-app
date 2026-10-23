export const APPOINTMENT_RESPONSE_SCHEMA = {
  type: 'object' as const,
  required: [
    'id',
    'blockId',
    'startAt',
    'endAt',
    'orientationType',
    'counterpart',
    'status',
  ],
  properties: {
    id: { type: 'string' as const, format: 'uuid' },
    blockId: { type: 'string' as const, format: 'uuid', nullable: true },
    startAt: { type: 'string' as const, format: 'date-time' },
    endAt: { type: 'string' as const, format: 'date-time' },
    orientationType: {
      type: 'object' as const,
      nullable: true,
      required: ['id', 'name'],
      properties: {
        id: { type: 'string' as const, format: 'uuid' },
        name: { type: 'string' as const },
      },
    },
    counterpart: {
      type: 'object' as const,
      required: ['id', 'fullName'],
      properties: {
        id: { type: 'string' as const, format: 'uuid' },
        fullName: { type: 'string' as const },
      },
    },
    status: { type: 'string' as const, example: 'CONFIRMED' },
  },
};

export const APPOINTMENT_MESSAGES = {
  invalidId: 'El id de la cita no es válido',
  invalidScope: 'El alcance debe ser upcoming o past',
  unauthorizedSession: 'La sesión es requerida o no es válida',
  forbiddenAccess: 'El usuario no tiene acceso a las citas solicitadas',
} as const;

export const FIND_MY_APPOINTMENTS_DOCS = {
  summary: 'Consulta las citas propias próximas o pasadas',
  description:
    'Incluye citas confirmadas y confirmaciones heredadas, normalizadas a CONFIRMED',
  scopeDescription:
    'Por defecto upcoming; la clasificación utiliza la hora de fin de la cita',
  invalidQueryDescription: 'Los parámetros de consulta no son válidos',
  responseDescription:
    'Citas propias con horarios UTC y nombre de la contraparte',
} as const;

export const FIND_APPOINTMENT_DOCS = {
  summary: 'Consulta una cita únicamente si el usuario participa en ella',
  idDescription: 'Identificador de la cita',
  invalidIdDescription: 'El identificador de la cita no es válido',
  notFoundDescription: 'La cita no existe',
  responseDescription: 'Detalle de una cita del participante autenticado',
} as const;
