import type { Prisma } from '../../../prisma/client.js';
import { SurveyTargetAudience } from '../types/survey.enum.js';
import { CAREER_SELECT, CATALOG_TITLE_SELECT } from './survey.constants.js';

export const SURVEY_PARTICIPATION_TARGET_SELECT = {
  id: true,
  title: true,
  academicPeriod: true,
  closesAt: true,
  lastReminderSentAt: true,
  status: CATALOG_TITLE_SELECT,
  targetAudience: CATALOG_TITLE_SELECT,
  career: { select: CAREER_SELECT },
} satisfies Prisma.SurveySelect;

export const SURVEY_AUDIENCE_LABELS = {
  [SurveyTargetAudience.ALL]: 'Titulados, estudiantes y mentores',
  [SurveyTargetAudience.GRADUATES]: 'Titulados',
  [SurveyTargetAudience.STUDENTS]: 'Estudiantes',
  [SurveyTargetAudience.MENTORS]: 'Mentores',
} as const;

export const SURVEY_AUDIENCE_LABEL_FALLBACKS = {
  audience: 'Sin público objetivo',
  career: 'Todas las carreras',
  period: 'Todas las gestiones',
} as const;

export const SURVEY_REMINDER_ERROR_MESSAGES = {
  NOT_ALLOWED:
    'Solo se pueden enviar recordatorios de encuestas publicadas y abiertas',
  NO_PENDING_RESPONDENTS:
    'Todos los titulados de la audiencia ya respondieron la encuesta',
  DELIVERY_FAILED:
    'No se pudo entregar ningún recordatorio. Intente nuevamente más tarde',
} as const;

export const SURVEY_ANSWER_FRONTEND_PATH = '/surveys';
export const SURVEY_REMINDER_GROUP_KEY_PREFIX = 'survey-reminder';
export const SURVEY_WITHOUT_CLOSING_DATE_TEXT = 'Sin fecha de cierre definida.';
