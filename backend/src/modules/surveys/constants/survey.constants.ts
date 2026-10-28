export const SURVEY_TITLE_MIN_LENGTH = 5;
export const SURVEY_TITLE_MAX_LENGTH = 150;
export const SURVEY_DESCRIPTION_MAX_LENGTH = 500;
export const SURVEY_STATEMENT_MAX_LENGTH = 250;
export const SURVEY_OPTION_MAX_LENGTH = 100;
export const SURVEY_MIN_OPTIONS_TO_PUBLISH = 2;
export const SURVEY_MIN_QUESTIONS_TO_PUBLISH = 1;
export const SURVEY_ALL_ACADEMIC_PERIODS = 'Todas';
export const SURVEY_ACADEMIC_PERIOD_PATTERN = /^(\d{4}|Todas)$/;
export const SURVEY_ACADEMIC_PERIOD_YEAR_PATTERN = /(\d{4})$/;

export const SURVEY_VALIDATION_MESSAGES = {
  TITLE_REQUIRED: 'El título de la encuesta es obligatorio',
  TITLE_TOO_SHORT: `El título debe tener al menos ${SURVEY_TITLE_MIN_LENGTH} caracteres`,
  TITLE_TOO_LONG: `El título no debe exceder los ${SURVEY_TITLE_MAX_LENGTH} caracteres`,
  DESCRIPTION_TOO_LONG: `La descripción no debe exceder los ${SURVEY_DESCRIPTION_MAX_LENGTH} caracteres`,
  INVALID_STATUS: 'El estado de la encuesta no es válido',
  INVALID_CAREER_ID: 'El identificador de la carrera no es válido',
  INVALID_SURVEY_ID: 'El identificador de la encuesta no es válido',
  CAREER_REQUIRED: 'La carrera dirigida es obligatoria',
  INVALID_ACADEMIC_PERIOD: 'La gestión debe ser un año, por ejemplo 2026, o Todas',
  ACADEMIC_PERIOD_REQUIRED: 'La gestión es obligatoria',
  INVALID_DATE: 'La fecha no es válida',
  OPENS_AT_REQUIRED: 'La fecha de apertura es obligatoria',
  CLOSES_AT_REQUIRED: 'La fecha de cierre es obligatoria',
  QUESTIONS_REQUIRED: 'La encuesta debe tener al menos una pregunta',
  STATEMENT_REQUIRED: 'El enunciado de la pregunta es obligatorio',
  STATEMENT_TOO_LONG: `El enunciado no debe exceder los ${SURVEY_STATEMENT_MAX_LENGTH} caracteres`,
  INVALID_QUESTION_TYPE: 'El tipo de pregunta no es válido',
  OPTION_REQUIRED: 'La opción no puede estar vacía',
  OPTION_TOO_LONG: `La opción no debe exceder los ${SURVEY_OPTION_MAX_LENGTH} caracteres`,
  OPTIONS_TOO_FEW: `La pregunta debe tener al menos ${SURVEY_MIN_OPTIONS_TO_PUBLISH} opciones`,
  OPTIONS_DUPLICATED: 'Las opciones de una pregunta no pueden repetirse',
} as const;

export const SURVEY_ERROR_MESSAGES = {
  TITLE_ALREADY_EXISTS:
    'Ya existe una encuesta con este título para la carrera y gestión seleccionadas',
  CLOSES_BEFORE_OPENS:
    'La fecha de cierre debe ser posterior a la fecha de apertura',
  OPENS_IN_THE_PAST:
    'La fecha de apertura no puede ser anterior a la fecha actual',
  CAREER_NOT_FOUND: 'La carrera seleccionada no existe',
  SURVEY_NOT_FOUND: 'La encuesta solicitada no existe',
  SURVEY_NOT_EDITABLE: 'Solo se pueden editar las encuestas en borrador',
  SURVEY_NOT_AVAILABLE:
    'Esta encuesta no está dirigida a tu carrera o año de egreso',
  STORAGE_UNAVAILABLE:
    'El registro de encuestas todavía no está disponible. Intente más tarde',
} as const;

export const SURVEY_DISPLAY_STATUS_LABELS = {
  draft: 'Borrador',
  published: 'Publicada',
  closed: 'Cerrada',
} as const;

export const CATALOG_TITLE_SELECT = { select: { title: true } } as const;

export const SURVEY_CREATED_SELECT = {
  id: true,
  title: true,
  status: CATALOG_TITLE_SELECT,
  createdAt: true,
} as const;

export const SURVEY_SUMMARY_SELECT = {
  id: true,
  title: true,
  status: CATALOG_TITLE_SELECT,
  academicPeriod: true,
  opensAt: true,
  closesAt: true,
  createdAt: true,
  career: { select: { id: true, title: true } },
  createdBy: { select: { firstName: true, lastName: true, email: true } },
  _count: { select: { questions: true, responses: true } },
} as const;

export const CAREER_SELECT = { id: true, title: true } as const;

export const SURVEY_DETAIL_INCLUDE = {
  career: { select: CAREER_SELECT },
  status: CATALOG_TITLE_SELECT,
  questions: {
    orderBy: { position: 'asc' },
    include: {
      type: CATALOG_TITLE_SELECT,
      options: { orderBy: { position: 'asc' } },
    },
  },
} as const;

export const SURVEY_STATISTICS_INCLUDE = {
  career: { select: CAREER_SELECT },
  status: CATALOG_TITLE_SELECT,
  questions: {
    orderBy: { position: 'asc' },
    include: {
      type: CATALOG_TITLE_SELECT,
      options: {
        orderBy: { position: 'asc' },
        include: { _count: { select: { answers: true } } },
      },
      _count: { select: { answers: true } },
    },
  },
  _count: { select: { responses: true } },
} as const;
