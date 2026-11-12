export const APPOINTMENT_MESSAGES = {
  invalidId: 'El id de la cita no es válido',
  invalidScope: 'El alcance debe ser upcoming o past',
  invalidPage: 'La página debe ser un número entero mayor o igual a 1',
  invalidPageSize: 'El tamaño de página debe ser un número entero entre 1 y 50',
  invalidBlockId: 'El bloque de disponibilidad no es válido',
  missingTopic: 'Selecciona el tema de la sesión',
  invalidTopic: 'El tema de la sesión no es válido',
  missingMessage: 'Escribe un mensaje para el mentor',
  messageTooLong: `El mensaje no puede superar los 300 caracteres`,
  unauthorizedSession: 'La sesión es requerida o no es válida',
  forbiddenAccess: 'El usuario no tiene acceso a las citas solicitadas',
} as const;

export const APPOINTMENT_DOCUMENT_RESPONSE_SCHEMA = {
  type: 'object' as const,
  required: ['fileName', 'mimeType', 'sizeBytes', 'uploadedAt'],
  properties: {
    fileName: { type: 'string' as const, example: 'Tesis_capitulo_2.pdf' },
    mimeType: {
      type: 'string' as const,
      enum: ['application/pdf', 'image/png', 'image/jpeg'],
    },
    sizeBytes: { type: 'integer' as const, example: 2516582 },
    uploadedAt: { type: 'string' as const, format: 'date-time' },
  },
};

export const APPOINTMENT_CANCELLATION_RESPONSE_SCHEMA = {
  type: 'object' as const,
  description: 'Solo en citas canceladas; null en las demás',
  required: ['cancelledBy', 'cancelledByMe', 'reason', 'cancelledAt'],
  properties: {
    cancelledBy: {
      type: 'string' as const,
      enum: ['MENTOR', 'STUDENT'],
      nullable: true,
      description: 'null si no se registró quién canceló',
    },
    cancelledByMe: { type: 'boolean' as const },
    reason: {
      type: 'string' as const,
      nullable: true,
      maxLength: 300,
      description: 'null si se canceló sin motivo',
    },
    cancelledAt: {
      type: 'string' as const,
      format: 'date-time',
      nullable: true,
    },
  },
};

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
    'message',
    'requestedAt',
    'document',
    'cancellation',
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
    status: {
      type: 'string' as const,
      example: 'CONFIRMED',
      description:
        'CONFIRMED hasta la hora de fin; COMPLETED desde la hora de fin (calculado, no se guarda); CANCELLED se conserva',
    },
    message: {
      type: 'string' as const,
      nullable: true,
      maxLength: 300,
    },
    requestedAt: { type: 'string' as const, format: 'date-time' },
    document: { ...APPOINTMENT_DOCUMENT_RESPONSE_SCHEMA, nullable: true },
    cancellation: {
      ...APPOINTMENT_CANCELLATION_RESPONSE_SCHEMA,
      nullable: true,
    },
  },
};

export const APPOINTMENT_DETAIL_RESPONSE_SCHEMA = {
  ...APPOINTMENT_RESPONSE_SCHEMA,
  required: [...APPOINTMENT_RESPONSE_SCHEMA.required, 'meetingUrl'],
  properties: {
    ...APPOINTMENT_RESPONSE_SCHEMA.properties,
    meetingUrl: {
      type: 'string' as const,
      format: 'uri',
      nullable: true,
      example: 'https://meet.jit.si/umssy-3f9c1a2e-5b7d-4c1e-9a2b-1c2d3e4f5a6b',
      description:
        'Enlace de la videollamada; solo para los participantes y mientras la cita está confirmada y no terminó',
    },
  },
};

export const CREATE_APPOINTMENT_DOCS = {
  summary: 'Solicita una cita en un horario libre y la devuelve confirmada',
  description:
    'Valida el bloque y la fecha, revisa al confirmar que el mentor siga disponible (403 si está en pausa) y crea la cita con estado CONFIRMED (201, horarios en UTC)',
  blockDescription:
    'Identificador (UUID) del bloque de disponibilidad a reservar',
  topicDescription:
    'Identificador (UUID) del tema de la sesión que ofrece el mentor',
  messageDescription: `Mensaje obligatorio para el mentor (de 1 a 300 caracteres, sin contar espacios al inicio y al final)`,
  createdDescription: 'Cita creada con estado CONFIRMED',
  badRequestDescription: `El cuerpo no es válido: tema ausente o no ofrecido por el mentor, o mensaje vacío o mayor a 300 caracteres`,
  notFoundDescription: 'El mentor del bloque no existe',
  conflictDescription:
    'El horario ya fue reservado, ya no está disponible porque el bloque se eliminó o el día está bloqueado, se cruza con otra cita o quien reserva ya tiene una cita ese día (hora de Bolivia)',
} as const;

export const FIND_MY_APPOINTMENTS_DOCS = {
  summary: 'Consulta las citas propias próximas o pasadas',
  description:
    'Incluye citas confirmadas y canceladas, con sus títulos heredados normalizados; past incluye además las completadas. Una cita confirmada se devuelve COMPLETED desde su hora de fin y una cancelada trae quién canceló y el motivo',
  scopeDescription:
    'Por defecto upcoming; la clasificación utiliza la hora de fin de la cita',
  invalidQueryDescription: 'Los parámetros de consulta no son válidos',
  pageDescription: 'Número de página, desde 1; por defecto 1',
  pageSizeDescription: 'Citas por página, entre 1 y 50; por defecto 10',
  responseDescription:
    'Página de citas propias con horarios UTC, nombre de la contraparte y total',
} as const;

export const FIND_APPOINTMENT_DOCS = {
  summary: 'Consulta una cita únicamente si el usuario participa en ella',
  description:
    'Incluye el enlace de la videollamada de una cita confirmada que no terminó (si aún no tiene enlace, se genera en esta consulta) y, si la cita está cancelada, quién canceló y el motivo',
  idDescription: 'Identificador de la cita',
  invalidIdDescription: 'El identificador de la cita no es válido',
  notFoundDescription: 'La cita no existe',
  responseDescription: 'Detalle de una cita del participante autenticado',
} as const;

export const FIND_COUNTERPART_PHOTO_DOCS = {
  summary: 'Descarga la foto de perfil de la otra persona de la cita',
  description:
    'Solo el mentor o el titulado de la cita pueden consultarla; devuelve la imagen PNG o JPEG',
  responseDescription: 'Foto de perfil de la contraparte',
  notFoundDescription: 'La cita no existe o la contraparte no tiene foto',
} as const;

export const UPLOAD_APPOINTMENT_DOCUMENT_DOCS = {
  summary: 'Adjunta un documento a una cita confirmada',
  description:
    'Solo quien reservó la cita puede adjuntar un PDF, PNG o JPG de hasta 5 MB mientras la cita esté confirmada y no haya terminado; si ya había un documento, se reemplaza',
  fileDescription: 'Documento PDF, PNG o JPG de hasta 5 MB',
  createdDescription: 'Documento guardado y asociado a la cita',
  badRequestDescription:
    'Falta el archivo, está vacío o está dañado, o el id de la cita no es válido',
  forbiddenDescription: 'El usuario no reservó la cita o no participa en ella',
  notFoundDescription: 'La cita no existe',
  conflictDescription: 'La cita no está confirmada o ya terminó',
  payloadTooLargeDescription: 'El archivo supera los 5 MB',
  unsupportedMediaTypeDescription: 'El archivo no es PDF, PNG ni JPG',
} as const;

export const DOWNLOAD_APPOINTMENT_DOCUMENT_DOCS = {
  summary: 'Descarga el documento de una cita',
  description:
    'Solo el mentor y quien reservó la cita pueden descargarlo; se entrega con su nombre original',
  okDescription: 'Contenido binario del documento',
  forbiddenDescription: 'El usuario no participa en la cita',
  notFoundDescription: 'La cita no existe o no tiene documento',
} as const;
