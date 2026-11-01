export const APPOINTMENT_MESSAGE_MAX_LENGTH = 300;

export const APPOINTMENT_MESSAGES = {
  invalidId: 'El id de la cita no es válido',
  invalidScope: 'El alcance debe ser upcoming o past',
  invalidBlockId: 'El bloque de disponibilidad no es válido',
  missingTopic: 'Selecciona el tema de la sesión',
  invalidTopic: 'El tema de la sesión no es válido',
  messageTooLong: `El mensaje no puede superar los ${APPOINTMENT_MESSAGE_MAX_LENGTH} caracteres`,
  unauthorizedSession: 'La sesión es requerida o no es válida',
  forbiddenAccess: 'El usuario no tiene acceso a las citas solicitadas',
} as const;

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
      required: ['id', 'fullName', 'role'],
      properties: {
        id: { type: 'string' as const, format: 'uuid' },
        fullName: { type: 'string' as const },
        role: { type: 'string' as const, enum: ['mentor', 'student'] },
      },
    },
    status: { type: 'string' as const, example: 'CONFIRMED' },
  },
};

export const CREATE_APPOINTMENT_DOCS = {
  summary: 'Solicita una cita en un horario libre y la devuelve confirmada',
  description:
    'Valida el bloque, la disponibilidad del mentor y la fecha, y crea la cita con estado CONFIRMED (201, horarios en UTC)',
  blockDescription: 'Identificador (UUID) del bloque de disponibilidad a reservar',
  topicDescription: 'Identificador (UUID) del tema de la sesión que ofrece el mentor',
  messageDescription: `Mensaje opcional para el mentor (máximo ${APPOINTMENT_MESSAGE_MAX_LENGTH} caracteres)`,
  createdDescription: 'Cita creada con estado CONFIRMED',
  badRequestDescription: `El cuerpo no es válido: tema ausente o no ofrecido por el mentor, o mensaje mayor a ${APPOINTMENT_MESSAGE_MAX_LENGTH} caracteres`,
  notFoundDescription: 'El bloque de disponibilidad o el mentor no existen',
  conflictDescription: 'El horario ya fue reservado o el día está bloqueado',
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
