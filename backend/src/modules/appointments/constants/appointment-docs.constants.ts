export const APPOINTMENT_MESSAGES = {
  invalidBlockId: 'El bloque de disponibilidad no es válido',
  missingTopic: 'Selecciona el tema de la sesión',
  invalidTopic: 'El tema de la sesión no es válido',
  messageTooLong: 'El mensaje no puede superar los 300 caracteres',
  unauthorizedSession: 'La sesión es requerida o no es válida',
  forbiddenAccess: 'El usuario no tiene acceso a las citas solicitadas',
} as const;

export const CREATE_APPOINTMENT_DOCS = {
  summary: 'Solicita una cita en un horario libre y la devuelve confirmada',
  description:
    'Valida el bloque, la disponibilidad del mentor y la fecha, y crea la cita con estado CONFIRMED (201, horarios en UTC)',
  blockDescription: 'Identificador (UUID) del bloque de disponibilidad a reservar',
  topicDescription: 'Identificador (UUID) del tema de la sesión que ofrece el mentor',
  messageDescription: 'Mensaje opcional para el mentor (máximo 300 caracteres)',
  createdDescription: 'Cita creada con estado CONFIRMED',
  badRequestDescription: 'El cuerpo no es válido: tema ausente o mensaje mayor a 300 caracteres',
  notFoundDescription: 'El bloque de disponibilidad o el mentor no existen',
  conflictDescription: 'El horario ya fue reservado o el día está bloqueado',
} as const;
