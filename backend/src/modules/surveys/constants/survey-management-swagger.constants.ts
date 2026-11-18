import { API_ERROR_SCHEMA } from '../../../common/constants/api-error-swagger.constants.js';
import type { ApiQueryOptions, ApiResponseOptions } from '@nestjs/swagger';
import {
  SURVEY_DISPLAY_STATUSES,
  SURVEY_QUESTION_TYPES,
  SURVEY_STATUSES,
  SURVEY_TARGET_AUDIENCES,
} from '../types/survey.enum.js';
import {
  ADMIN_AUTH_DESCRIPTION,
  EXAMPLE_CAREER_ID,
  EXAMPLE_OPTION_ID,
  EXAMPLE_QUESTION_ID,
  EXAMPLE_SURVEY_ID,
  INVALID_SURVEY_ID_EXAMPLE,
  RESPONDENT_AUTH_DESCRIPTION,
  SURVEY_NOT_FOUND_ERROR,
  VALIDATION_ERROR_SCHEMA,
  domainError,
  successEnvelope,
  successExample,
  validationError,
} from './survey-swagger.constants.js';
import {
  SURVEY_ALL_ACADEMIC_PERIODS,
  SURVEY_ALL_CAREERS,
  SURVEY_ERROR_MESSAGES,
  SURVEY_VALIDATION_MESSAGES,
} from './survey.constants.js';

const SURVEY_ANSWERED_MESSAGE = 'Respuestas guardadas con éxito';
const GENERIC_BAD_REQUEST_DETAIL = 'Los parámetros de la solicitud no son válidos.';

const CAREER_SCHEMA = {
  type: 'object',
  nullable: true,
  required: ['id', 'title'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
  },
};
const EXAMPLE_CAREER = { id: EXAMPLE_CAREER_ID, title: 'Ingeniería de Sistemas' };
const NULLABLE_DATE_TIME = { type: 'string', format: 'date-time', nullable: true };

const SURVEY_UPSERT_RULES = [
  '**Reglas del cuerpo:**',
  '- `status: draft` solo exige `title`; el resto puede completarse después.',
  `- \`status: published\` exige además \`careerId\`, \`academicPeriod\`, \`targetAudience\`, \`opensAt\`, \`closesAt\` y al menos una pregunta, cada una con enunciado y al menos 2 opciones sin repetir.`,
  `- \`careerId\`: UUID de una carrera existente o \`${SURVEY_ALL_CAREERS}\` para todas las carreras. \`academicPeriod\`: año de egreso (\`2026\`) o \`${SURVEY_ALL_ACADEMIC_PERIODS}\`. Cadena vacía o \`null\` equivale a omitir.`,
  '- Al publicar, `opensAt` no puede ser anterior a hoy y `closesAt` debe ser un día posterior a `opensAt` (fechas en hora de Bolivia).',
  '- El título no puede repetirse (sin distinguir mayúsculas) para la misma carrera y gestión entre encuestas en borrador o aún abiertas.',
  '- Las preguntas enviadas reemplazan a las existentes.',
].join('\n');

export const SURVEY_CREATE_DESCRIPTION = [
  'Crea una encuesta de empleabilidad en borrador o publicada. El creador es el usuario autenticado.',
  '',
  ADMIN_AUTH_DESCRIPTION,
  '',
  SURVEY_UPSERT_RULES,
].join('\n');

export const SURVEY_UPDATE_DESCRIPTION = [
  'Reemplaza el contenido de una encuesta en borrador y permite publicarla (`status: published`). Las encuestas ya publicadas no se editan.',
  '',
  ADMIN_AUTH_DESCRIPTION,
  '',
  SURVEY_UPSERT_RULES,
].join('\n');

const PUBLISHED_SURVEY_BODY = {
  title: 'Seguimiento de egresados 2026',
  description: 'Encuesta anual sobre la situación laboral de los titulados.',
  careerId: EXAMPLE_CAREER_ID,
  academicPeriod: '2025',
  targetAudience: 'graduates',
  opensAt: '2026-11-20T08:00:00-04:00',
  closesAt: '2026-12-20T23:59:00-04:00',
  status: 'published',
  questions: [
    {
      statement: '¿Cuál es tu situación laboral actual?',
      type: 'single_choice',
      isRequired: true,
      options: [
        { label: 'Empleado en mi área' },
        { label: 'Empleado en otra área' },
        { label: 'Buscando empleo' },
      ],
    },
  ],
};

export const SURVEY_UPSERT_BODY_EXAMPLES = {
  published: { summary: 'Encuesta publicada', value: PUBLISHED_SURVEY_BODY },
  draft: {
    summary: 'Borrador mínimo',
    value: { title: 'Encuesta de empleabilidad', status: 'draft' },
  },
};

const SURVEY_CREATED_DATA_SCHEMA = {
  type: 'object',
  required: ['id', 'title', 'status', 'createdAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    status: { type: 'string', enum: [...SURVEY_STATUSES] },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const SURVEY_CREATED_EXAMPLE_DATA = {
  id: EXAMPLE_SURVEY_ID,
  title: PUBLISHED_SURVEY_BODY.title,
  status: 'published',
  createdAt: '2026-11-16T15:00:00.000Z',
};

export const SURVEY_CREATED_RESPONSE: ApiResponseOptions = {
  status: 201,
  description: 'Encuesta creada.',
  schema: successEnvelope(SURVEY_CREATED_DATA_SCHEMA, 201),
  example: successExample(SURVEY_CREATED_EXAMPLE_DATA, 201),
};

export const SURVEY_UPDATED_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Encuesta actualizada.',
  schema: successEnvelope(SURVEY_CREATED_DATA_SCHEMA),
  example: successExample(SURVEY_CREATED_EXAMPLE_DATA),
};

const UPSERT_BAD_REQUEST_EXAMPLES = {
  titleTooShort: {
    summary: 'Título demasiado corto',
    value: validationError('title', SURVEY_VALIDATION_MESSAGES.TITLE_TOO_SHORT),
  },
  publishedWithoutCareer: {
    summary: 'Publicación sin carrera',
    value: validationError('careerId', SURVEY_VALIDATION_MESSAGES.CAREER_REQUIRED),
  },
  tooFewOptions: {
    summary: 'Pregunta con menos de 2 opciones',
    value: validationError(
      'questions.0.options',
      SURVEY_VALIDATION_MESSAGES.OPTIONS_TOO_FEW,
    ),
  },
  opensInThePast: {
    summary: 'Apertura en el pasado',
    value: domainError(
      400,
      'INVALID_SURVEY_SCHEDULE',
      SURVEY_ERROR_MESSAGES.OPENS_IN_THE_PAST,
      { field: 'opensAt' },
    ),
  },
  closesBeforeOpens: {
    summary: 'Cierre no posterior a la apertura',
    value: domainError(
      400,
      'INVALID_SURVEY_SCHEDULE',
      SURVEY_ERROR_MESSAGES.CLOSES_BEFORE_OPENS,
      { field: 'closesAt' },
    ),
  },
};

export const SURVEY_CREATE_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  status: 400,
  description:
    'Cuerpo inválido (`VALIDATION_ERROR`) o fechas de publicación inválidas (`INVALID_SURVEY_SCHEDULE`).',
  schema: VALIDATION_ERROR_SCHEMA,
  examples: UPSERT_BAD_REQUEST_EXAMPLES,
};

export const SURVEY_UPDATE_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  ...SURVEY_CREATE_BAD_REQUEST_RESPONSE,
  description:
    '`id` inválido, cuerpo inválido (`VALIDATION_ERROR`) o fechas de publicación inválidas (`INVALID_SURVEY_SCHEDULE`).',
  examples: { invalidId: INVALID_SURVEY_ID_EXAMPLE, ...UPSERT_BAD_REQUEST_EXAMPLES },
};

const CAREER_NOT_FOUND_EXAMPLE = {
  summary: 'Carrera inexistente',
  value: domainError(404, 'CAREER_NOT_FOUND', SURVEY_ERROR_MESSAGES.CAREER_NOT_FOUND, {
    field: 'careerId',
  }),
};

export const SURVEY_CREATE_NOT_FOUND_RESPONSE: ApiResponseOptions = {
  status: 404,
  description: 'La carrera indicada en `careerId` no existe.',
  schema: API_ERROR_SCHEMA,
  examples: { careerNotFound: CAREER_NOT_FOUND_EXAMPLE },
};

export const SURVEY_UPDATE_NOT_FOUND_RESPONSE: ApiResponseOptions = {
  status: 404,
  description: 'La encuesta (`SURVEY_NOT_FOUND`) o la carrera (`CAREER_NOT_FOUND`) no existe.',
  schema: API_ERROR_SCHEMA,
  examples: {
    surveyNotFound: { summary: 'Encuesta inexistente', value: SURVEY_NOT_FOUND_ERROR },
    careerNotFound: CAREER_NOT_FOUND_EXAMPLE,
  },
};

const TITLE_EXISTS_EXAMPLE = {
  summary: 'Título repetido',
  value: domainError(
    409,
    'SURVEY_TITLE_ALREADY_EXISTS',
    SURVEY_ERROR_MESSAGES.TITLE_ALREADY_EXISTS,
    { field: 'title' },
  ),
};

export const SURVEY_CREATE_CONFLICT_RESPONSE: ApiResponseOptions = {
  status: 409,
  description: 'Ya existe una encuesta vigente con el mismo título, carrera y gestión.',
  schema: API_ERROR_SCHEMA,
  examples: { titleExists: TITLE_EXISTS_EXAMPLE },
};

export const SURVEY_UPDATE_CONFLICT_RESPONSE: ApiResponseOptions = {
  status: 409,
  description:
    'La encuesta no está en borrador (`SURVEY_NOT_EDITABLE`) o el título ya existe (`SURVEY_TITLE_ALREADY_EXISTS`).',
  schema: API_ERROR_SCHEMA,
  examples: {
    notEditable: {
      summary: 'Encuesta no editable',
      value: domainError(409, 'SURVEY_NOT_EDITABLE', SURVEY_ERROR_MESSAGES.SURVEY_NOT_EDITABLE, {
        field: 'status',
      }),
    },
    titleExists: TITLE_EXISTS_EXAMPLE,
  },
};

export const SURVEY_LIST_DESCRIPTION = [
  'Lista todas las encuestas de empleabilidad, de la más reciente a la más antigua. Sin paginación ni filtros.',
  '',
  ADMIN_AUTH_DESCRIPTION,
  '',
  '`status` es el estado visible: `closed` cuando la encuesta publicada ya pasó su `closesAt`.',
].join('\n');

export const SURVEY_LIST_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Encuestas registradas.',
  schema: successEnvelope({
    type: 'array',
    items: {
      type: 'object',
      required: [
        'id',
        'title',
        'status',
        'career',
        'createdBy',
        'academicPeriod',
        'targetAudience',
        'opensAt',
        'closesAt',
        'questionCount',
        'responseCount',
        'createdAt',
      ],
      properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        status: { type: 'string', enum: [...SURVEY_DISPLAY_STATUSES] },
        career: CAREER_SCHEMA,
        createdBy: {
          type: 'object',
          required: ['fullName', 'email'],
          properties: {
            fullName: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        academicPeriod: { type: 'string', nullable: true },
        targetAudience: {
          type: 'string',
          nullable: true,
          enum: [...SURVEY_TARGET_AUDIENCES],
        },
        opensAt: NULLABLE_DATE_TIME,
        closesAt: NULLABLE_DATE_TIME,
        questionCount: { type: 'integer', minimum: 0 },
        responseCount: { type: 'integer', minimum: 0 },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  }),
  example: successExample([
    {
      id: EXAMPLE_SURVEY_ID,
      title: PUBLISHED_SURVEY_BODY.title,
      status: 'published',
      career: EXAMPLE_CAREER,
      createdBy: { fullName: 'María Gutiérrez', email: 'maria.gutierrez@umss.edu' },
      academicPeriod: '2025',
      targetAudience: 'graduates',
      opensAt: '2026-11-20T12:00:00.000Z',
      closesAt: '2026-12-21T03:59:00.000Z',
      questionCount: 1,
      responseCount: 30,
      createdAt: '2026-11-16T15:00:00.000Z',
    },
  ]),
};

export const SURVEY_DETAIL_DESCRIPTION = [
  'Devuelve una encuesta con sus preguntas y opciones ordenadas, para responderla o editarla.',
  '',
  RESPONDENT_AUTH_DESCRIPTION,
  '',
  '- `administrativo`: obtiene cualquier encuesta, incluidas las de borrador.',
  '- Resto de roles: solo encuestas publicadas, dirigidas a su rol, carrera y año de egreso, y cuya apertura ya llegó. Las encuestas en borrador responden 404.',
  '',
  '`status` es el estado almacenado (`draft` o `published`); para saber si ya cerró, usa `isExpired`. `hasAnswered` indica si el usuario autenticado ya respondió.',
].join('\n');

export const SURVEY_DETAIL_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Detalle de la encuesta.',
  schema: successEnvelope({
    type: 'object',
    required: [
      'id',
      'title',
      'description',
      'status',
      'career',
      'targetsAllCareers',
      'academicPeriod',
      'targetAudience',
      'opensAt',
      'closesAt',
      'hasAnswered',
      'isExpired',
      'responseCount',
      'questions',
    ],
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      description: { type: 'string', nullable: true },
      status: { type: 'string', enum: [...SURVEY_STATUSES] },
      career: CAREER_SCHEMA,
      targetsAllCareers: { type: 'boolean' },
      academicPeriod: { type: 'string', nullable: true },
      targetAudience: {
        type: 'string',
        nullable: true,
        enum: [...SURVEY_TARGET_AUDIENCES],
      },
      opensAt: NULLABLE_DATE_TIME,
      closesAt: NULLABLE_DATE_TIME,
      hasAnswered: { type: 'boolean' },
      isExpired: { type: 'boolean' },
      responseCount: { type: 'integer', minimum: 0 },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'position', 'statement', 'type', 'isRequired', 'options'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            position: { type: 'integer', minimum: 1 },
            statement: { type: 'string' },
            type: { type: 'string', enum: [...SURVEY_QUESTION_TYPES] },
            isRequired: { type: 'boolean' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'position', 'label'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  position: { type: 'integer', minimum: 1 },
                  label: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }),
  example: successExample({
    id: EXAMPLE_SURVEY_ID,
    title: PUBLISHED_SURVEY_BODY.title,
    description: PUBLISHED_SURVEY_BODY.description,
    status: 'published',
    career: EXAMPLE_CAREER,
    targetsAllCareers: false,
    academicPeriod: '2025',
    targetAudience: 'graduates',
    opensAt: '2026-11-20T12:00:00.000Z',
    closesAt: '2026-12-21T03:59:00.000Z',
    hasAnswered: false,
    isExpired: false,
    responseCount: 30,
    questions: [
      {
        id: EXAMPLE_QUESTION_ID,
        position: 1,
        statement: '¿Cuál es tu situación laboral actual?',
        type: 'single_choice',
        isRequired: true,
        options: [
          { id: EXAMPLE_OPTION_ID, position: 1, label: 'Empleado en mi área' },
          {
            id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
            position: 2,
            label: 'Buscando empleo',
          },
        ],
      },
    ],
  }),
};

const SURVEY_NOT_OPEN_EXAMPLE = {
  summary: 'Encuesta aún no abierta (no administrativos)',
  value: domainError(400, 'SURVEY_NOT_OPEN', SURVEY_ERROR_MESSAGES.SURVEY_NOT_OPEN, {
    field: 'surveyId',
  }),
};

export const SURVEY_DETAIL_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  status: 400,
  description: '`id` inválido o encuesta que todavía no abre (`SURVEY_NOT_OPEN`).',
  schema: VALIDATION_ERROR_SCHEMA,
  examples: { invalidId: INVALID_SURVEY_ID_EXAMPLE, notOpen: SURVEY_NOT_OPEN_EXAMPLE },
};

export const SURVEY_NOT_AVAILABLE_RESPONSE: ApiResponseOptions = {
  status: 403,
  description:
    'Rol no permitido (`FORBIDDEN_ROLE`) o encuesta no dirigida al perfil, carrera o año de egreso del usuario (`SURVEY_NOT_AVAILABLE`, solo para no administrativos).',
  schema: API_ERROR_SCHEMA,
  examples: {
    forbiddenRole: {
      summary: 'Rol no permitido',
      value: domainError(403, 'FORBIDDEN_ROLE', 'No tienes el rol necesario para este recurso'),
    },
    notAvailable: {
      summary: 'Encuesta no dirigida al usuario',
      value: domainError(
        403,
        'SURVEY_NOT_AVAILABLE',
        SURVEY_ERROR_MESSAGES.SURVEY_NOT_AVAILABLE,
        { field: 'surveyId' },
      ),
    },
  },
};

export const SURVEY_RESPONDENT_NOT_FOUND_RESPONSE: ApiResponseOptions = {
  status: 404,
  description:
    'La encuesta no existe o, para roles distintos de `administrativo`, no está publicada.',
  schema: API_ERROR_SCHEMA,
  example: SURVEY_NOT_FOUND_ERROR,
};

export const SURVEY_UNPUBLISH_DESCRIPTION = [
  'Devuelve a borrador una encuesta publicada que todavía no tiene respuestas, para poder corregirla.',
  '',
  ADMIN_AUTH_DESCRIPTION,
  '',
  'Responde 204 sin cuerpo.',
].join('\n');

export const SURVEY_UNPUBLISHED_RESPONSE: ApiResponseOptions = {
  status: 204,
  description: 'Encuesta devuelta a borrador. Sin cuerpo.',
};

export const SURVEY_UNPUBLISH_CONFLICT_RESPONSE: ApiResponseOptions = {
  status: 409,
  description:
    'La encuesta no está publicada (`SURVEY_NOT_PUBLISHED`) o ya tiene respuestas (`SURVEY_HAS_RESPONSES`).',
  schema: API_ERROR_SCHEMA,
  examples: {
    notPublished: {
      summary: 'Encuesta no publicada',
      value: domainError(409, 'SURVEY_NOT_PUBLISHED', SURVEY_ERROR_MESSAGES.SURVEY_NOT_PUBLISHED, {
        field: 'status',
      }),
    },
    hasResponses: {
      summary: 'Encuesta con respuestas',
      value: domainError(409, 'SURVEY_HAS_RESPONSES', SURVEY_ERROR_MESSAGES.SURVEY_HAS_RESPONSES, {
        field: 'status',
      }),
    },
  },
};

export const SURVEY_SUBMIT_RESPONSE_DESCRIPTION = [
  'Registra las respuestas del usuario autenticado a una encuesta publicada. Cada usuario responde una sola vez.',
  '',
  RESPONDENT_AUTH_DESCRIPTION,
  '',
  '- Para roles distintos de `administrativo` la encuesta debe estar dirigida al usuario y ya abierta.',
  '- Todas las preguntas con `isRequired: true` deben tener al menos una opción; las de tipo `single_choice` y `dropdown` admiten una sola opción.',
  '- Si no se cumplen estas dos reglas, la respuesta es 400 con el detalle genérico `' +
    GENERIC_BAD_REQUEST_DETAIL +
    '` y `data: null` (el motivo concreto no se devuelve).',
  '- No se valida que `questionId`/`optionIds` pertenezcan a la encuesta; los ids ajenos fallan en la base de datos (500).',
].join('\n');

export const SURVEY_SUBMIT_RESPONSE_BODY_EXAMPLES = {
  singleAnswer: {
    summary: 'Respuesta a una pregunta',
    value: { answers: [{ questionId: EXAMPLE_QUESTION_ID, optionIds: [EXAMPLE_OPTION_ID] }] },
  },
};

export const SURVEY_SUBMITTED_RESPONSE: ApiResponseOptions = {
  status: 201,
  description: 'Respuestas guardadas.',
  schema: successEnvelope(
    {
      type: 'object',
      required: ['success', 'message'],
      properties: {
        success: { type: 'boolean', enum: [true] },
        message: { type: 'string', example: SURVEY_ANSWERED_MESSAGE },
      },
    },
    201,
  ),
  example: successExample({ success: true, message: SURVEY_ANSWERED_MESSAGE }, 201),
};

export const SURVEY_SUBMIT_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  status: 400,
  description:
    '`id` o cuerpo inválidos, reglas de respuesta incumplidas, encuesta caducada (`SURVEY_EXPIRED`) o todavía no abierta (`SURVEY_NOT_OPEN`).',
  schema: VALIDATION_ERROR_SCHEMA,
  examples: {
    invalidId: INVALID_SURVEY_ID_EXAMPLE,
    emptyAnswers: {
      summary: 'Sin respuestas',
      value: validationError('answers', 'Debe responder al menos una pregunta'),
    },
    answerRules: {
      summary: 'Pregunta obligatoria sin responder o varias opciones en opción única',
      value: domainError(400, 'VALIDATION_ERROR', GENERIC_BAD_REQUEST_DETAIL),
    },
    expired: {
      summary: 'Encuesta caducada',
      value: domainError(
        400,
        'SURVEY_EXPIRED',
        'La encuesta ha caducado y no acepta más respuestas',
        { field: 'surveyId' },
      ),
    },
    notOpen: SURVEY_NOT_OPEN_EXAMPLE,
  },
};

export const SURVEY_ALREADY_ANSWERED_RESPONSE: ApiResponseOptions = {
  status: 409,
  description: 'El usuario ya respondió esta encuesta.',
  schema: API_ERROR_SCHEMA,
  example: domainError(409, 'SURVEY_ALREADY_ANSWERED', 'Ya has respondido a esta encuesta', {
    field: 'surveyId',
  }),
};

export const SURVEY_STATISTICS_PERIOD_QUERY: ApiQueryOptions = {
  name: 'period',
  required: false,
  description:
    'Semestre a analizar (`I` = enero a junio, `II` = julio a diciembre, hora de Bolivia). Si se envía, también se calcula la tendencia frente al semestre anterior. Sin él se consideran todas las respuestas.',
  schema: { type: 'string', pattern: '^(I|II)-\\d{4}$' },
  example: 'II-2026',
};

export const SURVEY_STATISTICS_DESCRIPTION = [
  'Devuelve los resultados agregados de la encuesta: respuestas por pregunta, conteo y porcentaje por opción, y un texto de tendencia.',
  '',
  ADMIN_AUTH_DESCRIPTION,
  '',
  '`availablePeriods` lista los semestres entre la apertura (o creación) y el cierre (o hoy). Los porcentajes de cada pregunta suman 100.',
].join('\n');

export const SURVEY_STATISTICS_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Estadísticas de la encuesta.',
  schema: successEnvelope({
    type: 'object',
    required: [
      'id',
      'title',
      'description',
      'status',
      'academicPeriod',
      'career',
      'opensAt',
      'closesAt',
      'totalResponses',
      'hasData',
      'period',
      'availablePeriods',
      'questions',
    ],
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      description: { type: 'string', nullable: true },
      status: { type: 'string', enum: [...SURVEY_DISPLAY_STATUSES] },
      academicPeriod: { type: 'string', nullable: true },
      career: CAREER_SCHEMA,
      opensAt: NULLABLE_DATE_TIME,
      closesAt: NULLABLE_DATE_TIME,
      totalResponses: { type: 'integer', minimum: 0 },
      hasData: { type: 'boolean' },
      period: { type: 'string', nullable: true, description: 'Semestre aplicado o `null`.' },
      availablePeriods: { type: 'array', items: { type: 'string' } },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          required: [
            'id',
            'position',
            'statement',
            'type',
            'isRequired',
            'answeredCount',
            'totalSelections',
            'options',
            'trend',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            position: { type: 'integer', minimum: 1 },
            statement: { type: 'string' },
            type: { type: 'string', enum: [...SURVEY_QUESTION_TYPES] },
            isRequired: { type: 'boolean' },
            answeredCount: { type: 'integer', minimum: 0 },
            totalSelections: { type: 'integer', minimum: 0 },
            options: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'label', 'count', 'percentage'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  label: { type: 'string' },
                  count: { type: 'integer', minimum: 0 },
                  percentage: { type: 'number', minimum: 0, maximum: 100 },
                },
              },
            },
            trend: {
              type: 'object',
              required: ['text', 'direction'],
              properties: {
                text: { type: 'string' },
                direction: { type: 'string', enum: ['up', 'down', 'neutral'] },
              },
            },
          },
        },
      },
    },
  }),
  example: successExample({
    id: EXAMPLE_SURVEY_ID,
    title: PUBLISHED_SURVEY_BODY.title,
    description: PUBLISHED_SURVEY_BODY.description,
    status: 'closed',
    academicPeriod: '2025',
    career: EXAMPLE_CAREER,
    opensAt: '2026-08-01T12:00:00.000Z',
    closesAt: '2026-10-31T03:59:00.000Z',
    totalResponses: 40,
    hasData: true,
    period: 'II-2026',
    availablePeriods: ['II-2026'],
    questions: [
      {
        id: EXAMPLE_QUESTION_ID,
        position: 1,
        statement: '¿Cuál es tu situación laboral actual?',
        type: 'single_choice',
        isRequired: true,
        answeredCount: 40,
        totalSelections: 40,
        options: [
          { id: EXAMPLE_OPTION_ID, label: 'Empleado en mi área', count: 30, percentage: 75 },
          {
            id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
            label: 'Buscando empleo',
            count: 10,
            percentage: 25,
          },
        ],
        trend: {
          text: 'La opción más elegida es «Empleado en mi área» con 75% (30 de 40 respuestas). Sube 5 pts frente a I-2026.',
          direction: 'up',
        },
      },
    ],
  }),
};

export const SURVEY_STATISTICS_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  status: 400,
  description: '`id` inválido o `period` con formato inválido.',
  content: {
    'application/json': {
      schema: VALIDATION_ERROR_SCHEMA,
      examples: {
        invalidId: INVALID_SURVEY_ID_EXAMPLE,
        invalidPeriod: {
          summary: 'Periodo con formato inválido',
          value: validationError(
            'period',
            SURVEY_VALIDATION_MESSAGES.INVALID_STATISTICS_PERIOD,
          ),
        },
      },
    },
  },
};

export const SURVEY_REPORT_NOT_FOUND_RESPONSE: ApiResponseOptions = {
  status: 404,
  description: 'La encuesta no existe.',
  content: {
    'application/json': {
      schema: API_ERROR_SCHEMA,
      example: SURVEY_NOT_FOUND_ERROR,
    },
  },
};

export const SURVEY_REPORT_DESCRIPTION = [
  'Genera el informe estadístico de la encuesta en PDF (mismos datos que `GET /surveys/{id}/statistics`) y lo registra en el historial de reportes del administrador con tipo `SURVEY_STATISTICS`.',
  '',
  ADMIN_AUTH_DESCRIPTION,
  '',
  '**Descarga:** `application/pdf` como adjunto en `Content-Disposition` (expuesta por CORS); no se envuelve en `{ statusCode, ok, detail, data }`.',
  '',
  'Nombre del archivo: `reporte-encuesta-<título normalizado, máx. 40 caracteres>[-<periodo en minúsculas>]-<AAAA-MM-DD>.pdf`.',
].join('\n');

export const SURVEY_REPORT_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Informe PDF generado.',
  headers: {
    'Content-Type': {
      description: 'Siempre `application/pdf`.',
      schema: { type: 'string', enum: ['application/pdf'] },
    },
    'Content-Disposition': {
      description: 'Descarga como adjunto con el nombre del archivo.',
      schema: {
        type: 'string',
        example:
          'attachment; filename="reporte-encuesta-seguimiento-de-egresados-2026-ii-2026-2026-11-16.pdf"',
      },
    },
  },
  content: {
    'application/pdf': { schema: { type: 'string', format: 'binary' } },
  },
};
