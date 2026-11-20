import { API_ERROR_SCHEMA } from '../../../common/constants/api-error-swagger.constants.js';
import type { ApiResponseOptions } from '@nestjs/swagger';
import { SURVEY_ALERT_CONFIG_DEFAULTS } from './survey-alert-config.constants.js';
import {
  SURVEY_AUDIENCE_LABELS,
  SURVEY_REMINDER_ERROR_MESSAGES,
} from './survey-participation.constants.js';
import {
  ADMIN_AUTH_DESCRIPTION,
  EXAMPLE_QUESTION_ID,
  EXAMPLE_SURVEY_ID,
  INVALID_SURVEY_ID_EXAMPLE,
  SUCCESS_DETAIL,
  VALIDATION_ERROR_SCHEMA,
  domainError,
  successEnvelope,
  validationError,
} from './survey-swagger.constants.js';

const ALERT_CONFIG_DATA_SCHEMA = {
  type: 'object',
  required: ['enabled', 'threshold', 'questionIds'],
  properties: {
    enabled: { type: 'boolean', description: 'Si las alertas están activas.' },
    threshold: {
      type: 'integer',
      minimum: 1,
      maximum: 50,
      description: 'Variación mínima, en puntos porcentuales, que dispara la alerta.',
    },
    questionIds: {
      type: 'array',
      nullable: true,
      items: { type: 'string' },
      description: 'Preguntas monitoreadas; `null` monitorea todas.',
    },
  },
};

export const SURVEY_GET_ALERT_CONFIG_DESCRIPTION = [
  'Devuelve la configuración de alertas de variación de resultados de la encuesta.',
  '',
  ADMIN_AUTH_DESCRIPTION,
  '',
  `Si la encuesta aún no tiene configuración guardada se devuelven los valores por defecto (\`enabled: ${SURVEY_ALERT_CONFIG_DEFAULTS.enabled}\`, \`threshold: ${SURVEY_ALERT_CONFIG_DEFAULTS.threshold}\`, \`questionIds: null\`). Este endpoint no verifica que la encuesta exista, por lo que no responde 404.`,
].join('\n');

export const SURVEY_GET_ALERT_CONFIG_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Configuración de alertas (guardada o por defecto).',
  schema: successEnvelope(ALERT_CONFIG_DATA_SCHEMA),
  examples: {
    saved: {
      summary: 'Configuración guardada',
      value: {
        statusCode: 200,
        ok: true,
        detail: SUCCESS_DETAIL,
        data: { enabled: true, threshold: 15, questionIds: [EXAMPLE_QUESTION_ID] },
      },
    },
    defaults: {
      summary: 'Sin configuración: valores por defecto',
      value: {
        statusCode: 200,
        ok: true,
        detail: SUCCESS_DETAIL,
        data: {
          enabled: SURVEY_ALERT_CONFIG_DEFAULTS.enabled,
          threshold: SURVEY_ALERT_CONFIG_DEFAULTS.threshold,
          questionIds: null,
        },
      },
    },
  },
};

export const SURVEY_SAVE_ALERT_CONFIG_DESCRIPTION = [
  'Crea o reemplaza la configuración de alertas de variación de la encuesta.',
  '',
  ADMIN_AUTH_DESCRIPTION,
  '',
  `\`enabled\` e \`isEnabled\` son alias; si se envían ambos prevalece \`enabled\` y, si no se envía ninguno, se usa \`${SURVEY_ALERT_CONFIG_DEFAULTS.enabled}\`. \`questionIds\` omitido o \`null\` monitorea todas las preguntas; los ids no se validan contra la encuesta.`,
].join('\n');

export const SURVEY_SAVE_ALERT_CONFIG_BODY_EXAMPLES = {
  selectedQuestions: {
    summary: 'Alertas activas para preguntas específicas',
    value: { enabled: true, threshold: 15, questionIds: [EXAMPLE_QUESTION_ID] },
  },
  allQuestions: {
    summary: 'Alertas desactivadas para todas las preguntas',
    value: { enabled: false, threshold: 10, questionIds: null },
  },
};

export const SURVEY_SAVE_ALERT_CONFIG_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Configuración guardada.',
  schema: successEnvelope({
    ...ALERT_CONFIG_DATA_SCHEMA,
    required: ['saved', ...ALERT_CONFIG_DATA_SCHEMA.required],
    properties: {
      saved: { type: 'boolean', enum: [true] },
      ...ALERT_CONFIG_DATA_SCHEMA.properties,
    },
  }),
  example: {
    statusCode: 200,
    ok: true,
    detail: SUCCESS_DETAIL,
    data: { saved: true, enabled: true, threshold: 15, questionIds: [EXAMPLE_QUESTION_ID] },
  },
};

export const SURVEY_SAVE_ALERT_CONFIG_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  status: 400,
  description: '`id` inválido o cuerpo que no cumple el esquema.',
  schema: VALIDATION_ERROR_SCHEMA,
  examples: {
    invalidId: INVALID_SURVEY_ID_EXAMPLE,
    thresholdOutOfRange: {
      summary: 'Umbral fuera de rango',
      value: validationError(
        'threshold',
        'El umbral máximo es 50 puntos porcentuales',
      ),
    },
    missingThreshold: {
      summary: 'Umbral ausente',
      value: validationError(
        'threshold',
        'Invalid input: expected number, received undefined',
      ),
    },
  },
};

export const SURVEY_GET_PARTICIPATION_DESCRIPTION = [
  'Calcula la cobertura de respuesta de la audiencia objetivo de la encuesta (rol según público objetivo, carrera y gestión de titulación configuradas).',
  '',
  ADMIN_AUTH_DESCRIPTION,
  '',
  '`responseRate` es un entero entre 0 y 100. `canSendReminder` es `true` solo si hay pendientes y la encuesta está publicada y sin cerrar.',
].join('\n');

export const SURVEY_GET_PARTICIPATION_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Estado de participación de la encuesta.',
  schema: successEnvelope({
    type: 'object',
    required: [
      'surveyId',
      'respondedCount',
      'eligibleCount',
      'pendingCount',
      'responseRate',
      'audienceLabel',
      'lastReminderSentAt',
      'canSendReminder',
    ],
    properties: {
      surveyId: { type: 'string', format: 'uuid' },
      respondedCount: { type: 'integer', minimum: 0 },
      eligibleCount: { type: 'integer', minimum: 0 },
      pendingCount: { type: 'integer', minimum: 0 },
      responseRate: { type: 'integer', minimum: 0, maximum: 100 },
      audienceLabel: {
        type: 'string',
        description: 'Audiencia · carrera · gestión, separadas por « · ».',
      },
      lastReminderSentAt: { type: 'string', format: 'date-time', nullable: true },
      canSendReminder: { type: 'boolean' },
    },
  }),
  example: {
    statusCode: 200,
    ok: true,
    detail: SUCCESS_DETAIL,
    data: {
      surveyId: EXAMPLE_SURVEY_ID,
      respondedCount: 30,
      eligibleCount: 120,
      pendingCount: 90,
      responseRate: 25,
      audienceLabel: `${SURVEY_AUDIENCE_LABELS.graduates} · Ingeniería de Sistemas · Gestión 2024`,
      lastReminderSentAt: '2026-11-10T14:30:00.000Z',
      canSendReminder: true,
    },
  },
};

export const SURVEY_SEND_REMINDERS_DESCRIPTION = [
  'Envía un recordatorio (correo y push, mediante `NotificationsService.notify()`) solo a los miembros de la audiencia que aún no respondieron y registra la fecha del envío.',
  '',
  ADMIN_AUTH_DESCRIPTION,
  '',
  'El cuerpo debe ser un objeto vacío (`{}`) o omitirse; no admite propiedades adicionales.',
].join('\n');

export const SURVEY_SEND_REMINDERS_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Recordatorios enviados (al menos un correo o push entregado).',
  schema: successEnvelope({
    type: 'object',
    required: [
      'surveyId',
      'pendingCount',
      'emailsDelivered',
      'emailsFailed',
      'pushStatus',
      'sentAt',
    ],
    properties: {
      surveyId: { type: 'string', format: 'uuid' },
      pendingCount: { type: 'integer', minimum: 1 },
      emailsDelivered: { type: 'integer', minimum: 0 },
      emailsFailed: { type: 'integer', minimum: 0 },
      pushStatus: { type: 'string', enum: ['sent', 'partial', 'failed', 'skipped'] },
      sentAt: { type: 'string', format: 'date-time' },
    },
  }),
  example: {
    statusCode: 200,
    ok: true,
    detail: SUCCESS_DETAIL,
    data: {
      surveyId: EXAMPLE_SURVEY_ID,
      pendingCount: 90,
      emailsDelivered: 88,
      emailsFailed: 2,
      pushStatus: 'partial',
      sentAt: '2026-11-16T15:00:00.000Z',
    },
  },
};

export const SURVEY_SEND_REMINDERS_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  status: 400,
  description: '`id` inválido o cuerpo con propiedades no permitidas.',
  schema: VALIDATION_ERROR_SCHEMA,
  examples: {
    invalidId: INVALID_SURVEY_ID_EXAMPLE,
    unexpectedProperty: {
      summary: 'Cuerpo con propiedades',
      value: validationError('valor', 'Unrecognized key: "message"'),
    },
  },
};

export const SURVEY_SEND_REMINDERS_CONFLICT_RESPONSE: ApiResponseOptions = {
  status: 409,
  description:
    'La encuesta no está publicada o ya cerró (`SURVEY_REMINDER_NOT_ALLOWED`), o no quedan pendientes (`SURVEY_WITHOUT_PENDING_RESPONDENTS`).',
  schema: API_ERROR_SCHEMA,
  examples: {
    notAllowed: {
      summary: 'Encuesta no abierta',
      value: domainError(
        409,
        'SURVEY_REMINDER_NOT_ALLOWED',
        SURVEY_REMINDER_ERROR_MESSAGES.NOT_ALLOWED,
      ),
    },
    noPending: {
      summary: 'Sin pendientes',
      value: domainError(
        409,
        'SURVEY_WITHOUT_PENDING_RESPONDENTS',
        SURVEY_REMINDER_ERROR_MESSAGES.NO_PENDING_RESPONDENTS,
      ),
    },
  },
};

export const SURVEY_SEND_REMINDERS_BAD_GATEWAY_RESPONSE: ApiResponseOptions = {
  status: 502,
  description: 'No se entregó ningún correo ni push.',
  schema: API_ERROR_SCHEMA,
  example: domainError(
    502,
    'SURVEY_REMINDER_DELIVERY_FAILED',
    SURVEY_REMINDER_ERROR_MESSAGES.DELIVERY_FAILED,
  ),
};
